# ruff: noqa
"""Context item semantic tagging service for agent-driven memory enhancement."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ...models.context import ContextItemType
from ...utils.db import as_json
from ...utils.supabase_client import supabase_client as supabase

logger = logging.getLogger("uvicorn.error")


class ContextTagRequest(BaseModel):
    """Request to create context item tags for memory objects."""
    target_id: UUID
    target_type: str = Field(..., pattern="^(block|document|basket)$")
    context_type: ContextItemType
    content: str = Field(..., min_length=3)
    confidence: float = Field(ge=0.0, le=1.0)
    agent_id: str
    meta_notes: Optional[str] = None


class SemanticRelationship(BaseModel):
    """A semantic relationship between memory objects."""
    source_id: UUID
    source_type: str
    target_id: UUID
    target_type: str
    relationship_type: str  # 'similar_to', 'contradicts', 'expands_on', etc.
    confidence: float
    reasoning: str


class ContextTaggingResult(BaseModel):
    """Result of context tagging operation."""
    context_items_created: List[Dict[str, Any]]
    relationships_identified: List[SemanticRelationship]
    tagging_summary: str
    total_confidence: float


class ContextTaggerService:
    """Service for agent-driven semantic tagging of memory objects."""

    @classmethod
    async def tag_memory_object(
        cls,
        request: ContextTagRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Create context item tag for a memory object."""

        # Validate the target exists and belongs to workspace
        target_object = await cls._validate_target(request.target_id, request.target_type, workspace_id)
        if not target_object:
            raise ValueError(f"Target {request.target_type} {request.target_id} not found")

        # Get basket_id from target
        basket_id = target_object.get("basket_id")
        if not basket_id:
            raise ValueError(f"Cannot determine basket for {request.target_type}")

        # Insert context item via RPC
        insert_resp = supabase.rpc('fn_context_item_upsert_bulk', {
            "p_items": [
                {
                    "basket_id": str(basket_id),
                    "type": request.context_type.value,
                    "content": request.content,
                    "title": None,
                    "description": request.meta_notes,
                }
            ]
        }).execute()
        context_item_id = insert_resp.data

        # Create tagging event
        await cls._log_tagging_event(
            target_id=request.target_id,
            target_type=request.target_type,
            context_item_id=context_item_id,
            context_type=request.context_type,
            agent_id=request.agent_id,
            basket_id=basket_id,
        )

        item_resp = (
            supabase.table("context_items")
            .select("*")
            .eq("id", str(context_item_id))
            .maybe_single()
            .execute()
        )

        return item_resp.data if item_resp.data else {"id": str(context_item_id)}

    @classmethod
    async def analyze_memory_semantics(
        cls,
        basket_id: UUID,
        workspace_id: str,
        agent_id: str,
        focus_types: Optional[List[ContextItemType]] = None
    ) -> ContextTaggingResult:
        """Analyze memory in a basket and suggest semantic tags."""

        # Get all blocks and existing context items in basket
        blocks_resp = (
            supabase.table("blocks")
            .select("id,semantic_type,content,state")
            .eq("basket_id", str(basket_id))
            .eq("workspace_id", workspace_id)
            .neq("state", "REJECTED")  # Skip rejected blocks
            .execute()
        )

        context_resp = (
            supabase.table("context_items")
            .select("id,type,content,block_id,document_id")
            .eq("basket_id", str(basket_id))
            .eq("status", "active")
            .execute()
        )

        blocks = blocks_resp.data or []
        existing_context = context_resp.data or []

        # Analyze and suggest new context items
        suggested_tags = await cls._analyze_semantic_patterns(
            blocks, existing_context, focus_types
        )

        # Create high-confidence suggestions
        created_items = []
        for suggestion in suggested_tags:
            if suggestion["confidence"] >= 0.7:  # Only auto-create high-confidence tags
                try:
                    request = ContextTagRequest(
                        target_id=UUID(suggestion["target_id"]),
                        target_type=suggestion["target_type"],
                        context_type=ContextItemType(suggestion["context_type"]),
                        content=suggestion["content"],
                        confidence=suggestion["confidence"],
                        agent_id=agent_id,
                        meta_notes=suggestion["reasoning"]
                    )

                    created_item = await cls.tag_memory_object(request, workspace_id)
                    created_items.append(created_item)

                except Exception as e:
                    logger.exception(f"Failed to create suggested tag: {e}")
                    continue

        # Identify semantic relationships
        relationships = await cls._identify_relationships(blocks, existing_context)

        return ContextTaggingResult(
            context_items_created=created_items,
            relationships_identified=relationships,
            tagging_summary=f"Created {len(created_items)} semantic tags from {len(suggested_tags)} suggestions",
            total_confidence=sum(item.get("confidence", 0) for item in created_items) / len(created_items) if created_items else 0.0
        )

    @classmethod
    async def _validate_target(cls, target_id: UUID, target_type: str, workspace_id: str) -> Optional[Dict]:
        """Validate that target object exists and belongs to workspace."""

        if target_type == "block":
            resp = (
                supabase.table("blocks")
                .select("id,basket_id,workspace_id")
                .eq("id", str(target_id))
                .eq("workspace_id", workspace_id)
                .maybe_single()
                .execute()
            )
        elif target_type == "document":
            resp = (
                supabase.table("documents")
                .select("id,basket_id,workspace_id")
                .eq("id", str(target_id))
                .eq("workspace_id", workspace_id)
                .maybe_single()
                .execute()
            )
        elif target_type == "basket":
            resp = (
                supabase.table("baskets")
                .select("id,workspace_id")
                .eq("id", str(target_id))
                .eq("workspace_id", workspace_id)
                .maybe_single()
                .execute()
            )
            # For baskets, set basket_id to the target_id itself
            if resp.data:
                resp.data["basket_id"] = str(target_id)
        else:
            return None

        return resp.data

    @classmethod
    async def _analyze_semantic_patterns(
        cls,
        blocks: List[Dict],
        existing_context: List[Dict],
        focus_types: Optional[List[ContextItemType]] = None
    ) -> List[Dict[str, Any]]:
        """Analyze blocks for semantic patterns and suggest context tags."""

        suggestions = []
        existing_tags = {(item.get("block_id"), item.get("type")) for item in existing_context}

        for block in blocks:
            block_id = block["id"]
            content = block.get("content", "").lower()
            semantic_type = block.get("semantic_type", "")

            # Skip if we already have tags for this block
            if any(block_id == tag[0] for tag in existing_tags):
                continue

            # Analyze content for semantic patterns
            potential_tags = []

            # Theme detection
            if any(keyword in content for keyword in ["theme", "pattern", "trend", "style"]):
                potential_tags.append({
                    "context_type": "theme",
                    "content": f"Thematic element: {content[:100]}...",
                    "confidence": 0.8,
                    "reasoning": "Contains thematic language"
                })

            # Goal detection
            if any(keyword in content for keyword in ["goal", "objective", "aim", "want", "need"]):
                potential_tags.append({
                    "context_type": "goal",
                    "content": f"Goal identified: {content[:100]}...",
                    "confidence": 0.9,
                    "reasoning": "Contains goal-oriented language"
                })

            # Audience detection
            if any(keyword in content for keyword in ["user", "customer", "audience", "people", "users"]):
                potential_tags.append({
                    "context_type": "audience",
                    "content": f"Audience reference: {content[:100]}...",
                    "confidence": 0.8,
                    "reasoning": "References target audience"
                })

            # Constraint detection
            if any(keyword in content for keyword in ["problem", "issue", "challenge", "limitation", "constraint"]):
                potential_tags.append({
                    "context_type": "constraint",
                    "content": f"Constraint: {content[:100]}...",
                    "confidence": 0.8,
                    "reasoning": "Identifies constraints or problems"
                })

            # Category by semantic type
            if semantic_type in ["insight", "strategy", "concept"]:
                potential_tags.append({
                    "context_type": "category",
                    "content": f"Category: {semantic_type}",
                    "confidence": 0.7,
                    "reasoning": f"Categorized by semantic type: {semantic_type}"
                })

            # Add to suggestions with metadata
            for tag in potential_tags:
                # Apply focus filter if specified
                if focus_types and ContextItemType(tag["context_type"]) not in focus_types:
                    continue

                suggestions.append({
                    "target_id": block_id,
                    "target_type": "block",
                    **tag
                })

        return suggestions

    @classmethod
    async def _identify_relationships(
        cls,
        blocks: List[Dict],
        context_items: List[Dict]
    ) -> List[SemanticRelationship]:
        """Identify semantic relationships between memory objects."""

        relationships = []

        # Simple similarity detection based on content overlap
        for i, block1 in enumerate(blocks):
            for block2 in blocks[i+1:]:
                similarity_score = cls._calculate_content_similarity(
                    block1.get("content", ""),
                    block2.get("content", "")
                )

                if similarity_score > 0.7:
                    relationships.append(SemanticRelationship(
                        source_id=UUID(block1["id"]),
                        source_type="block",
                        target_id=UUID(block2["id"]),
                        target_type="block",
                        relationship_type="similar_to",
                        confidence=similarity_score,
                        reasoning=f"Content similarity score: {similarity_score:.2f}"
                    ))

        return relationships

    @classmethod
    def _calculate_content_similarity(cls, content1: str, content2: str) -> float:
        """Calculate simple content similarity score."""
        if not content1 or not content2:
            return 0.0

        # Simple word overlap similarity
        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    @classmethod
    async def _log_tagging_event(
        cls,
        target_id: UUID,
        target_type: str,
        context_item_id: UUID,
        context_type: ContextItemType,
        agent_id: str,
        basket_id: str
    ) -> None:
        """Log context tagging event."""

        event_data = {
            "id": str(uuid4()),
            "basket_id": basket_id,
            "kind": "context_item.created",
            "payload": {
                "context_item_id": str(context_item_id),
                "target_id": str(target_id),
                "target_type": target_type,
                "context_type": context_type.value,
                "agent_id": agent_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

        supabase.table("events").insert(as_json(event_data)).execute()
