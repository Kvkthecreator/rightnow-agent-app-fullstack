"""
P4 Composition Agent - YARNNN Canon v2.1 Compliant

Implements intelligent document composition from substrate memory.
Sacred Principle #3: "Narrative is Deliberate" - Documents compose substrate references + authored prose.

This agent:
1. Analyzes intent to understand document purpose
2. Queries substrate comprehensively across all types
3. Scores relevance based on semantic similarity, recency, relationships
4. Generates thoughtful narrative structure
5. Composes document with clear reasoning
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from uuid import UUID

from app.utils.supabase_client import supabase_admin_client as supabase
from services.llm import get_llm
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass 
class AgentResponse:
    """Standard agent response format"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None

logger = logging.getLogger("uvicorn.error")


class CompositionRequest:
    """Request for P4 document composition"""
    def __init__(
        self,
        document_id: str,
        basket_id: str,
        workspace_id: str,
        intent: str,
        window: Optional[Dict[str, Any]] = None,
        pinned_ids: Optional[List[str]] = None
    ):
        self.document_id = document_id
        self.basket_id = basket_id
        self.workspace_id = workspace_id
        self.intent = intent
        self.window = window or {}
        self.pinned_ids = pinned_ids or []


class P4CompositionAgent:
    """
    P4 Composition Agent - Thoughtful document composition from substrate
    
    Canon Compliance:
    - P4 consumes substrate, never creates it
    - Respects substrate equality (blocks, dumps, context_items, timeline_events)
    - Creates document artifacts with clear reasoning
    - Emits proper timeline events
    """
    
    def __init__(self):
        self.llm = get_llm()
        logger.info("P4 Composition Agent initialized")
    
    async def process(self, request: CompositionRequest) -> AgentResponse:
        """
        Process document composition request with intelligent substrate selection
        """
        logger.info(f"P4 Composition: Processing document {request.document_id} with intent: {request.intent}")
        
        try:
            # Phase 1: Analyze intent and determine composition strategy
            strategy = await self._analyze_intent(request)
            
            # Phase 2: Query substrate comprehensively
            substrate_candidates = await self._query_substrate(request, strategy)
            
            # Phase 3: Score and select substrate
            selected_substrate = await self._score_and_select(substrate_candidates, request, strategy)
            
            # Phase 4: Generate narrative structure
            narrative = await self._generate_narrative(selected_substrate, request, strategy)
            
            # Phase 5: Compose document
            composition_result = await self._compose_document(
                request.document_id,
                selected_substrate,
                narrative,
                request.workspace_id
            )
            
            return AgentResponse(
                success=True,
                message="Document composed successfully",
                data={
                    "document_id": request.document_id,
                    "substrate_count": len(selected_substrate),
                    "composition_summary": composition_result.get("summary"),
                    "confidence": strategy.get("confidence", 0.8)
                }
            )
            
        except Exception as e:
            logger.exception(f"P4 Composition failed for document {request.document_id}: {e}")
            
            # Update document with failure status
            await self._mark_composition_failed(request.document_id, str(e))
            
            return AgentResponse(
                success=False,
                message=f"Composition failed: {str(e)}",
                data={"document_id": request.document_id}
            )
    
    async def _analyze_intent(self, request: CompositionRequest) -> Dict[str, Any]:
        """
        Analyze user intent to determine composition strategy
        """
        prompt = f"""Analyze this document composition intent and provide a strategy.

Intent: {request.intent}
Basket Context: Document being composed from memory in basket {request.basket_id}

Provide a JSON strategy with:
1. document_type: The type of document (e.g., "summary", "analysis", "plan", "reflection", "report")
2. key_themes: List of 3-5 key themes or topics to focus on
3. substrate_priorities: What types of substrate to prioritize
   - blocks: true/false (structured insights)
   - dumps: true/false (raw memories)
   - context_items: true/false (entities, concepts)
   - relationships: true/false (connections between substrate)
4. organization: How to organize the document ("chronological", "thematic", "priority", "categorical")
5. tone: The appropriate tone ("analytical", "narrative", "instructional", "reflective")
6. confidence: 0.0-1.0 confidence in understanding the intent

Example response:
{{
  "document_type": "analysis",
  "key_themes": ["project planning", "technical architecture", "team coordination"],
  "substrate_priorities": {{
    "blocks": true,
    "dumps": false,
    "context_items": true,
    "relationships": true
  }},
  "organization": "thematic",
  "tone": "analytical",
  "confidence": 0.85
}}"""

        response = await self.llm.get_json_response(
            prompt,
            temperature=0.3,
            schema_name="p4_intent_strategy",
        )
        
        strategy = response.parsed
        strategy["original_intent"] = request.intent
        
        logger.info(f"P4 Composition strategy: {strategy}")
        return strategy
    
    async def _query_substrate(self, request: CompositionRequest, strategy: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Query all relevant substrate based on strategy
        """
        candidates = []
        
        # Query blocks if prioritized
        if strategy["substrate_priorities"].get("blocks", True):
            blocks_query = supabase.table("blocks").select("*").eq("basket_id", request.basket_id)
            
            # Apply window filter if specified
            if request.window.get("start_date"):
                blocks_query = blocks_query.gte("created_at", request.window["start_date"])
            if request.window.get("end_date"):
                blocks_query = blocks_query.lte("created_at", request.window["end_date"])
            
            # Exclude rejected blocks
            blocks_query = blocks_query.neq("state", "REJECTED")
            
            blocks_response = blocks_query.execute()
            
            for block in blocks_response.data:
                candidates.append({
                    "type": "block",
                    "id": block["id"],
                    "content": block.get("content", ""),
                    "title": block.get("title", ""),
                    "semantic_type": block.get("semantic_type"),
                    "confidence_score": block.get("confidence_score", 0.7),
                    "created_at": block["created_at"],
                    "metadata": block
                })
        
        # Query context items if prioritized
        if strategy["substrate_priorities"].get("context_items", True):
            items_response = supabase.table("context_items").select("*")\
                .eq("basket_id", request.basket_id)\
                .eq("state", "ACTIVE")\
                .execute()
            
            for item in items_response.data:
                candidates.append({
                    "type": "context_item",
                    "id": item["id"],
                    "content": item.get("label", ""),
                    "kind": item.get("kind"),
                    "created_at": item["created_at"],
                    "metadata": item
                })
        
        # Query raw dumps if prioritized
        if strategy["substrate_priorities"].get("dumps", False):
            dumps_query = supabase.table("raw_dumps").select("*").eq("basket_id", request.basket_id)
            
            if request.window.get("start_date"):
                dumps_query = dumps_query.gte("created_at", request.window["start_date"])
            if request.window.get("end_date"):
                dumps_query = dumps_query.lte("created_at", request.window["end_date"])
            
            # Limit dumps to prevent overwhelming the composition
            dumps_response = dumps_query.limit(20).execute()
            
            for dump in dumps_response.data:
                candidates.append({
                    "type": "dump",
                    "id": dump["id"],
                    "content": dump.get("body_md", "") or dump.get("text_dump", ""),
                    "created_at": dump["created_at"],
                    "metadata": dump
                })
        
        # Add pinned items if specified
        if request.pinned_ids:
            # TODO: Query pinned items across all substrate types
            pass
        
        logger.info(f"P4 Composition: Found {len(candidates)} substrate candidates")
        return candidates
    
    async def _score_and_select(
        self, 
        candidates: List[Dict[str, Any]], 
        request: CompositionRequest,
        strategy: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Score substrate candidates and select the most relevant
        """
        if not candidates:
            return []
        
        # Prepare candidates for LLM scoring
        candidates_text = "\n\n".join([
            f"[{i}] Type: {c['type']}\n"
            f"Content: {c['content'][:500]}...\n"
            f"Created: {c['created_at']}\n"
            f"Metadata: {json.dumps({k: v for k, v in c.get('metadata', {}).items() if k in ['semantic_type', 'confidence_score', 'kind']})}"
            for i, c in enumerate(candidates[:30])  # Limit to prevent context overflow
        ])
        
        scoring_prompt = f"""Score these substrate candidates for relevance to the document composition.

Document Intent: {request.intent}
Document Type: {strategy['document_type']}
Key Themes: {', '.join(strategy['key_themes'])}

Substrate Candidates:
{candidates_text}

Provide a JSON response with:
1. selected_indices: List of candidate indices to include (aim for 5-15 most relevant)
2. reasoning: Brief explanation of selection criteria
3. groupings: How to group selected substrate (by theme, chronology, etc.)
4. coverage_assessment: Assessment of whether we have enough substrate

Example:
{{
  "selected_indices": [0, 2, 5, 7, 11],
  "reasoning": "Selected blocks that directly address project architecture and planning themes",
  "groupings": {{
    "architecture": [0, 2],
    "planning": [5, 7],
    "insights": [11]
  }},
  "coverage_assessment": "Good coverage of main themes, but lacking recent updates"
}}"""

        response = await self.llm.get_json_response(
            scoring_prompt,
            temperature=0.4,
            schema_name="p4_scoring_selection",
        )
        
        selection_result = response.parsed
        
        # Extract selected substrate
        selected = []
        for idx in selection_result.get("selected_indices", []):
            if 0 <= idx < len(candidates):
                substrate = candidates[idx].copy()
                # Add selection metadata
                substrate["selection_reason"] = selection_result.get("reasoning", "")
                selected.append(substrate)
        
        # If no substrate selected, provide explanation
        if not selected and candidates:
            # Select top 5 by confidence/recency as fallback
            selected = sorted(
                candidates[:10], 
                key=lambda x: (x.get("confidence_score", 0.5), x.get("created_at", "")),
                reverse=True
            )[:5]
        
        logger.info(f"P4 Composition: Selected {len(selected)} substrate items")
        return selected
    
    async def _generate_narrative(
        self,
        selected_substrate: List[Dict[str, Any]],
        request: CompositionRequest,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate narrative structure for the document
        """
        if not selected_substrate:
            # Handle case with no substrate
            return {
                "sections": [{
                    "title": "Document Status",
                    "content": f"This document was created with the intent: \"{request.intent}\". However, there is insufficient substrate (memory) available in this basket to compose a meaningful document. Consider adding more memories, thoughts, or observations related to this topic.",
                    "order": 0
                }],
                "summary": "Insufficient substrate for composition"
            }
        
        # Prepare substrate summary for narrative generation
        substrate_summary = "\n\n".join([
            f"[{s['type'].upper()}] {s.get('title', s.get('content', '')[:100])}..."
            for s in selected_substrate
        ])
        
        narrative_prompt = f"""Generate a narrative structure for this document.

Intent: {request.intent}
Document Type: {strategy['document_type']}
Tone: {strategy['tone']}
Organization: {strategy['organization']}

Selected Substrate:
{substrate_summary}

Create a JSON structure with:
1. sections: Array of sections, each with:
   - title: Section title
   - content: Brief description of what this section will cover
   - substrate_refs: List of substrate types to reference
   - order: Section order (0-based)
2. introduction: Opening paragraph that explains the document's purpose
3. summary: One-line summary of the document
4. composition_notes: Notes about what was included/excluded and why

Example:
{{
  "sections": [
    {{
      "title": "Overview",
      "content": "High-level summary of the project architecture",
      "substrate_refs": ["block", "context_item"],
      "order": 0
    }}
  ],
  "introduction": "This document synthesizes recent thoughts on...",
  "summary": "Comprehensive analysis of project architecture decisions",
  "composition_notes": "Focused on technical blocks, excluded preliminary dumps"
}}"""

        response = await self.llm.get_json_response(
            narrative_prompt,
            temperature=0.6,
            schema_name="p4_narrative_structure",
        )
        
        narrative = response.parsed
        logger.info(f"P4 Composition: Generated narrative with {len(narrative.get('sections', []))} sections")
        
        return narrative
    
    async def _compose_document(
        self,
        document_id: str,
        selected_substrate: List[Dict[str, Any]],
        narrative: Dict[str, Any],
        workspace_id: str
    ) -> Dict[str, Any]:
        """
        Compose final document with substrate references and narrative
        """
        try:
            # Build document content
            content_parts = []
            
            # Add introduction
            if narrative.get("introduction"):
                content_parts.append(narrative["introduction"])
                content_parts.append("")  # Empty line
            
            # Add composition notes if substrate was limited
            if len(selected_substrate) == 0:
                content_parts.append("*Note: This document has limited content due to insufficient substrate in the basket.*")
                content_parts.append("")
            elif narrative.get("composition_notes"):
                content_parts.append(f"*Composition Notes: {narrative['composition_notes']}*")
                content_parts.append("")
            
            # Add sections
            for section in narrative.get("sections", []):
                content_parts.append(f"## {section['title']}")
                content_parts.append("")
                content_parts.append(section['content'])
                content_parts.append("")
            
            # Join content
            final_content = "\n".join(content_parts)
            
            # Update document with composed content (Canon: P4 = Pure Artifact Creation)
            doc_update = {
                "content_raw": final_content,
                "content_rendered": final_content,  # For now, same as raw
                "metadata": {
                    "composition_status": "completed",
                    "composition_completed_at": datetime.now(timezone.utc).isoformat(),
                    "composition_summary": narrative.get("summary", ""),
                    "composition_substrate_count": len(selected_substrate),
                    "composition_narrative": narrative,
                    # Canon: Store substrate references as artifact metadata (not substrate mutations)
                    "substrate_references": [
                        {
                            "substrate_type": substrate["type"],
                            "substrate_id": substrate["id"],
                            "role": "primary" if idx < 5 else "supporting",
                            "weight": substrate.get("confidence_score", 0.7),
                            "content_snippet": substrate.get("content", "")[:200],
                            "order": idx,
                            "selection_reason": substrate.get("selection_reason", ""),
                            "attached_at": datetime.now(timezone.utc).isoformat()
                        }
                        for idx, substrate in enumerate(selected_substrate)
                    ]
                }
            }
            
            update_response = supabase.table("documents")\
                .update(doc_update)\
                .eq("id", document_id)\
                .execute()
            
            if not update_response.data:
                raise RuntimeError("Failed to update document with composition")
            
            # Canon Compliance: P4 only creates artifacts, no substrate mutations
            # Substrate references now stored in document metadata (artifact)
            logger.info(f"✅ Canon-pure P4 composition: {len(selected_substrate)} substrate references stored as document metadata")
            
            if selected_substrate:
                logger.info("📚 Substrate references (stored as artifact metadata):")
                for idx, substrate in enumerate(selected_substrate):
                    logger.info(f"   [{idx}] {substrate['type']}:{substrate['id']} - {substrate.get('title', 'No title')}")
            
            # Create new document version
            version_response = supabase.rpc("fn_document_create_version", {
                "p_document_id": document_id,
                "p_content": final_content,
                "p_version_message": f"Composed from {len(selected_substrate)} substrate items"
            }).execute()
            
            # Emit timeline event
            timeline_response = supabase.rpc("fn_timeline_emit", {
                "p_basket_id": supabase.table("documents").select("basket_id").eq("id", document_id).execute().data[0]["basket_id"],
                "p_kind": "document.composed",
                "p_ref_id": document_id,
                "p_preview": f"Document composed: {narrative.get('summary', 'Composition complete')}",
                "p_payload": json.dumps({
                    "substrate_count": len(selected_substrate),
                    "narrative_sections": len(narrative.get("sections", [])),
                    "composition_type": "intelligent"
                })
            }).execute()
            
            return {
                "success": True,
                "summary": narrative.get("summary", "Document composed"),
                "substrate_count": len(selected_substrate),
                "content_length": len(final_content)
            }
            
        except Exception as e:
            logger.exception(f"Failed to compose document {document_id}: {e}")
            raise
    
    async def _mark_composition_failed(self, document_id: str, error: str) -> None:
        """
        Mark document composition as failed
        """
        try:
            update_response = supabase.table("documents").update({
                "metadata": {
                    "composition_status": "failed",
                    "composition_error": error,
                    "composition_failed_at": datetime.now(timezone.utc).isoformat()
                }
            }).eq("id", document_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to mark composition failed for {document_id}: {e}")