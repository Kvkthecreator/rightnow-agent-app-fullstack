"""
Improved P1 Substrate Agent - Focused on Quality Over Complexity

Implements a practical, domain-aware approach that delivers quality extraction.
"""

import logging
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID
import os
from openai import OpenAI

from app.utils.supabase_client import supabase_admin_client as supabase
from app.schemas.focused_extraction import (
    FocusedExtraction, EXTRACTION_TEMPLATES, detect_content_type,
    ContentType, ExtractedFact, ExtractedInsight, ExtractedAction, ExtractedContext
)

# Simplified environment config
MODEL_P1 = os.getenv("LLM_MODEL_P1", "gpt-4o-mini")
TEMP_P1 = float(os.getenv("LLM_TEMP_P1", "0.1"))
SEED_P1 = int(os.getenv("LLM_SEED_P1", "1"))

logger = logging.getLogger("uvicorn.error")


class ImprovedP1SubstrateAgent:
    """
    Improved P1 Substrate Agent focused on extraction quality.
    
    Key improvements:
    1. Simplified schema that LLMs can actually handle
    2. Domain-specific prompts for better extraction
    3. Removed complex provenance requirements
    4. Focus on actionable facts, insights, and recommendations
    """
    
    pipeline = "P1_SUBSTRATE_IMPROVED"
    agent_name = "ImprovedP1SubstrateAgent"
    
    def __init__(self):
        self.logger = logger
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OPENAI_API_KEY not set")
        self.logger.info(f"Improved P1 Substrate Agent initialized with model={MODEL_P1}")
    
    def _client(self) -> OpenAI:
        """Get OpenAI client"""
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def create_substrate(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create quality substrate using focused extraction.

        Phase A: Anchor-blind P1 (respects phase boundaries)
        - P1 extracts claims from dumps without anchor awareness
        - Deduplication and anchor mapping happens in P2 (normalization)
        - Keeps P1 single-responsibility: extract facts from content
        """
        start_time = datetime.utcnow()
        workspace_id = UUID(request["workspace_id"])
        basket_id = UUID(request["basket_id"])
        dump_id = UUID(request["dump_id"])
        agent_id = request["agent_id"]

        try:
            # Get dump content
            content = await self._get_dump_content(dump_id, workspace_id)
            if not content:
                raise ValueError(f"No content found for dump {dump_id}")

            # Detect content type for domain-specific extraction
            content_type = detect_content_type(content)
            self.logger.info(f"Detected content type: {content_type} for dump {dump_id}")

            # Extract using focused approach (NO basket context - anchor-blind)
            extraction_result = await self._extract_focused(
                content,
                content_type,
                str(dump_id)
            )
            
            # V3.0: Transform to unified blocks (all semantic_types)
            substrate_blocks = self._transform_to_substrate(
                extraction_result, dump_id, content_type
            )

            # Calculate metrics
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            # Categorize blocks by type for logging
            knowledge_blocks = [b for b in substrate_blocks if b.get('semantic_type') in [
                'fact', 'metric', 'event', 'insight', 'action', 'finding', 'quote', 'summary'
            ]]
            meaning_blocks = [b for b in substrate_blocks if b.get('semantic_type') in [
                'intent', 'objective', 'rationale', 'principle', 'assumption', 'context', 'constraint'
            ]]
            structural_blocks = [b for b in substrate_blocks if b.get('semantic_type') in [
                'entity', 'classification', 'reference'
            ]]

            self.logger.info(
                f"Improved P1 v3.0 completed: dump_id={dump_id}, "
                f"total_blocks={len(substrate_blocks)} "
                f"(knowledge={len(knowledge_blocks)}, meaning={len(meaning_blocks)}, structural={len(structural_blocks)}), "
                f"content_type={content_type}, processing_time_ms={processing_time_ms}"
            )

            return {
                "primary_dump_id": str(dump_id),
                "processed_dump_ids": [str(dump_id)],
                "batch_mode": False,
                "blocks_created": [],  # Empty for governance compliance
                "processing_time_ms": processing_time_ms,
                "agent_confidence": extraction_result.extraction_confidence,
                "extraction_method": f"focused_{content_type}",
                "content_type": content_type,
                # V3.0: Single substrate_ingredients (unified blocks)
                "substrate_ingredients": substrate_blocks,
                "extraction_summary": {
                    "total_blocks": len(substrate_blocks),
                    "knowledge_blocks": len(knowledge_blocks),
                    "meaning_blocks": len(meaning_blocks),
                    "structural_blocks": len(structural_blocks),
                    "facts_count": len(extraction_result.facts),
                    "insights_count": len(extraction_result.insights),
                    "actions_count": len(extraction_result.actions),
                    "context_count": len(extraction_result.context),
                    "primary_theme": extraction_result.primary_theme
                }
            }
            
        except Exception as e:
            self.logger.error(f"Improved P1 failed for dump {dump_id}: {e}")
            raise
    
    async def _get_dump_content(self, dump_id: UUID, workspace_id: UUID) -> Optional[str]:
        """Get content from raw dump"""
        try:
            response = supabase.table("raw_dumps").select("text_dump,body_md")\
                .eq("id", str(dump_id))\
                .eq("workspace_id", str(workspace_id))\
                .single().execute()

            if response.data:
                # Prefer body_md over text_dump
                return response.data.get("body_md") or response.data.get("text_dump")
            return None

        except Exception as e:
            self.logger.error(f"Failed to get dump content: {e}")
            return None

    async def _extract_focused(
        self,
        content: str,
        content_type: ContentType,
        dump_id: str
    ) -> FocusedExtraction:
        """Extract using focused, domain-specific approach (anchor-blind)"""

        # Get appropriate template
        template = EXTRACTION_TEMPLATES[content_type]

        # Build extraction prompt (no basket context)
        system_prompt = template.system_prompt

        user_prompt = f"""{template.extraction_guidance}

CONTENT TO ANALYZE:
{content}

Extract the information above in the specified JSON format. Focus on quality over quantity - better to have fewer high-quality extractions than many low-quality ones.

EXTRACTION GUIDELINES:
- Extract all significant facts, insights, and context from the content
- Don't filter based on assumed importance - capture what's actually present
- P2 normalization will handle deduplication and anchor mapping
- Focus on accuracy and completeness of extraction"""
        
        # Response format for structured output
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "focused_extraction",
                "schema": FocusedExtraction.model_json_schema()
            }
        }
        
        client = self._client()
        
        # Retry logic for reliability
        for attempt in range(3):
            try:
                # Build request parameters
                request_params = {
                    "model": MODEL_P1,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": response_format,
                    "max_completion_tokens": template.max_tokens,
                    "seed": SEED_P1
                }
                
                # Only add temperature if it's different from default (1.0)
                # Some models don't support custom temperature values
                if template.temperature != 1.0:
                    request_params["temperature"] = template.temperature
                
                response = client.chat.completions.create(**request_params)
                
                raw_response = response.choices[0].message.content
                data = json.loads(raw_response)
                extraction = FocusedExtraction.model_validate(data)
                
                # Set detected content type if not provided
                if not hasattr(extraction, 'content_type') or not extraction.content_type:
                    extraction.content_type = content_type
                
                self.logger.info(f"Focused extraction successful: {len(extraction.facts)} facts, "
                               f"{len(extraction.insights)} insights, {len(extraction.actions)} actions")
                
                return extraction
                
            except Exception as e:
                if attempt == 2:  # Last attempt
                    self.logger.error(f"Focused extraction failed after 3 attempts: {e}")
                    # Return minimal extraction rather than failing completely
                    return FocusedExtraction(
                        summary=f"Extraction failed: {str(e)[:100]}",
                        facts=[],
                        insights=[],
                        actions=[],
                        context=[],
                        content_type=content_type,
                        primary_theme="extraction_failed",
                        extraction_confidence=0.1
                    )
                    
                self.logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")
                time.sleep(1.0 * (attempt + 1))
    
    def _transform_to_substrate(
        self,
        extraction: FocusedExtraction,
        dump_id: UUID,
        content_type: ContentType
    ) -> List[Dict[str, Any]]:
        """
        V3.0: Transform focused extraction to unified substrate blocks

        Returns single list of blocks with all semantic_types:
        - Knowledge types (fact, metric, event, insight, action, etc.)
        - Meaning types (intent, objective, rationale, etc.)
        - Structural types (entity, classification, reference)

        Emergent anchors proposed based on content semantics.
        """

        substrate_blocks = []

        # Create summary block
        substrate_blocks.append({
            "semantic_type": "summary",
            "title": f"Summary - {extraction.primary_theme}",
            "content": extraction.summary,
            "confidence_score": extraction.extraction_confidence,
            "anchor_role": None,  # Summaries typically don't need anchors
            "anchor_status": None,
            "anchor_confidence": None,
            "metadata": {
                "content_type": content_type,
                "source_dump_id": str(dump_id),
                "extraction_method": "focused_summary"
            }
        })
        
        # Mapping for legacy fact types -> canonical semantic categories
        fact_type_map = {
            "metric": "metric",
            "event": "event",
            "status": "status",
            "quote": "quote",
            "finding": "finding",
            "feature": "finding",
            "milestone": "event"
        }

        # Transform facts to knowledge blocks with emergent anchors
        for i, fact in enumerate(extraction.facts[:10]):  # Limit to 10 best facts
            semantic_type = fact_type_map.get(fact.type.lower() if isinstance(fact.type, str) else "", "finding")

            # V3.0: Emergent anchor inference
            anchor_role, anchor_confidence = self._infer_anchor_from_fact(fact)

            substrate_blocks.append({
                "semantic_type": semantic_type,
                "title": f"{fact.type.title()}: {fact.text[:50]}...",
                "content": fact.text,
                "confidence_score": fact.confidence,
                "anchor_role": anchor_role,  # Emergent
                "anchor_status": "proposed" if anchor_role else None,
                "anchor_confidence": anchor_confidence if anchor_role else None,
                "metadata": {
                    "fact_type": fact.type,
                    "source_hint": fact.source_hint,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_fact"
                }
            })

        # Transform insights to blocks (insights semantic_type)
        for i, insight in enumerate(extraction.insights[:8]):  # Limit to 8 best insights
            substrate_blocks.append({
                "semantic_type": "insight",
                "title": f"Insight: {insight.insight[:50]}...",
                "content": insight.insight,
                "confidence_score": insight.confidence,
                "anchor_role": "insight",  # Insights often anchored as "insight"
                "anchor_status": "proposed",
                "anchor_confidence": insight.confidence,
                "metadata": {
                    "supporting_facts": insight.supporting_facts,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_insight"
                }
            })

        # Transform actions to blocks (action semantic_type)
        for i, action in enumerate(extraction.actions[:6]):  # Limit to 6 best actions
            substrate_blocks.append({
                "semantic_type": "action",
                "title": f"Action ({action.priority}): {action.action[:50]}...",
                "content": action.action,
                "confidence_score": 0.8,  # Actions are typically high confidence
                "anchor_role": "solution" if action.priority == "high" else None,  # High-priority actions = solutions
                "anchor_status": "proposed" if action.priority == "high" else None,
                "anchor_confidence": 0.85 if action.priority == "high" else None,
                "metadata": {
                    "priority": action.priority,
                    "timeline": action.timeline,
                    "owner": action.owner,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_action"
                }
            })

        # V3.0: Transform context to ENTITY blocks (structural type)
        for ctx in extraction.context[:15]:  # Limit to 15 best context items
            # Generate semantic meaning based on entity role and context
            semantic_meaning = self._generate_semantic_meaning(ctx, content_type, extraction)

            substrate_blocks.append({
                "semantic_type": "entity",  # V3.0: Structural type
                "title": ctx.entity,
                "content": semantic_meaning,  # Canon: Semantic interpretation
                "confidence_score": 0.7,  # Entities generally medium confidence
                "anchor_role": None,  # Entities typically don't need anchors (just references)
                "anchor_status": None,
                "anchor_confidence": None,
                "metadata": {
                    "entity_role": ctx.role,
                    "entity_details": ctx.details,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_context"
                }
            })

        # V3.0: Add content type as CLASSIFICATION block (structural type)
        substrate_blocks.append({
            "semantic_type": "classification",  # V3.0: Structural type
            "title": f"Content Type: {content_type}",
            "content": f"This content was classified as {content_type} type, focusing on {extraction.primary_theme}",
            "confidence_score": extraction.extraction_confidence,
            "anchor_role": None,  # Classifications don't need anchors
            "anchor_status": None,
            "anchor_confidence": None,
            "metadata": {
                "classification_type": "content_type",
                "primary_theme": extraction.primary_theme,
                "extraction_confidence": extraction.extraction_confidence,
                "source_dump_id": str(dump_id),
                "extraction_method": "content_classification"
            }
        })

        return substrate_blocks  # V3.0: Single list
    
    def _generate_semantic_meaning(
        self,
        ctx: ExtractedContext,
        content_type: ContentType,
        extraction: FocusedExtraction
    ) -> str:
        """
        Generate Canon-compliant semantic meaning for context items.
        This transforms simple entity labels into meaningful semantic interpretations.
        """
        entity = ctx.entity
        role = ctx.role
        details = ctx.details or ""
        
        # Build semantic interpretation based on role and content type
        if content_type == ContentType.FINANCIAL:
            if "company" in role.lower() or "competitor" in role.lower():
                return f"{entity} represents a {role} in the financial landscape. {details} Their presence indicates market dynamics and competitive positioning."
            elif "executive" in role.lower() or "ceo" in role.lower():
                return f"{entity} as {role} provides leadership perspective. {details} Their statements reflect strategic direction and company vision."
            elif "product" in role.lower():
                return f"{entity} is a {role} offering. {details} It represents revenue streams and market positioning."
        
        elif content_type == ContentType.SECURITY:
            if "threat" in role.lower() or "attacker" in role.lower():
                return f"{entity} identified as {role}. {details} This represents security risk requiring mitigation."
            elif "system" in role.lower() or "service" in role.lower():
                return f"{entity} is a {role} component. {details} Its security posture affects overall system integrity."
        
        elif content_type == ContentType.PRODUCT:
            if "feature" in role.lower():
                return f"{entity} represents a {role}. {details} This shapes user experience and product value."
            elif "user" in role.lower() or "customer" in role.lower():
                return f"{entity} as {role} defines product requirements. {details} Understanding their needs drives product evolution."
        
        # Default semantic interpretation
        theme = extraction.primary_theme
        return f"{entity} plays the role of {role} in the context of {theme}. {details or 'This entity shapes the narrative and outcomes described.'}"

    def _infer_anchor_from_fact(self, fact: ExtractedFact) -> tuple[Optional[str], Optional[float]]:
        """
        V3.0: Emergent anchor inference from fact content

        Returns (anchor_role, anchor_confidence) or (None, None)

        Common emergent anchors:
        - problem: Issues, bugs, pain points
        - metric: Measurements, KPIs, targets
        - customer: User needs, feedback
        - solution: Fixes, improvements
        - feature: Capabilities, functionality
        - constraint: Limitations, requirements
        - vision: Goals, aspirations
        """
        content_lower = fact.text.lower()

        # Problem indicators
        if any(word in content_lower for word in [
            'issue', 'problem', 'bug', 'error', 'fail', 'struggle', 'difficulty',
            'pain point', 'complaint', 'drop-off', 'abandon', 'friction'
        ]):
            return ("problem", min(fact.confidence + 0.1, 1.0))

        # Metric indicators
        if fact.type.lower() == 'metric' or any(char in fact.text for char in ['%', '$', '#']):
            return ("metric", fact.confidence)

        # Customer indicators
        if any(word in content_lower for word in [
            'user', 'customer', 'client', 'feedback', 'review', 'satisfaction',
            'request', 'need', 'want', 'prefer'
        ]):
            return ("customer", fact.confidence)

        # Feature indicators
        if any(word in content_lower for word in [
            'feature', 'capability', 'functionality', 'integration', 'api',
            'release', 'launch', 'deploy'
        ]):
            return ("feature", fact.confidence)

        # Constraint indicators
        if any(word in content_lower for word in [
            'limit', 'constraint', 'requirement', 'must', 'comply', 'regulation',
            'budget', 'deadline', 'restriction'
        ]):
            return ("constraint", fact.confidence)

        # Vision indicators
        if any(word in content_lower for word in [
            'goal', 'target', 'objective', 'aim', 'aspire', 'vision',
            'become', 'achieve', 'reach'
        ]):
            return ("vision", fact.confidence)

        # No clear anchor
        return (None, None)

    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information"""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "substrate_extraction",
            "status": "active",
            "approach": "focused_domain_aware",
            "improvements": "simplified_schema,domain_prompts,removed_provenance_complexity"
        }
