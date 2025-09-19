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
        Create quality substrate using focused extraction approach.
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
            
            # Extract using focused approach
            extraction_result = await self._extract_focused(content, content_type, str(dump_id))
            
            # Transform to blocks and context items
            blocks, context_items = self._transform_to_substrate(
                extraction_result, dump_id, content_type
            )
            
            # Calculate metrics
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"Improved P1 completed: dump_id={dump_id}, "
                f"blocks={len(blocks)}, context_items={len(context_items)}, "
                f"content_type={content_type}, processing_time_ms={processing_time_ms}"
            )
            
            return {
                "primary_dump_id": str(dump_id),
                "processed_dump_ids": [str(dump_id)],
                "batch_mode": False,
                "blocks_created": [],  # Empty for governance compliance
                "context_items_created": [],  # Empty for governance compliance
                "processing_time_ms": processing_time_ms,
                "agent_confidence": extraction_result.extraction_confidence,
                "extraction_method": f"focused_{content_type}",
                "content_type": content_type,
                # Provide ingredients for governance
                "block_ingredients": blocks,
                "context_item_ingredients": context_items,
                "extraction_summary": {
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
        """Extract using focused, domain-specific approach"""
        
        # Get appropriate template
        template = EXTRACTION_TEMPLATES[content_type]
        
        # Build prompt
        system_prompt = template.system_prompt
        user_prompt = f"""{template.extraction_guidance}

CONTENT TO ANALYZE:
{content}

Extract the information above in the specified JSON format. Focus on quality over quantity - better to have fewer high-quality extractions than many low-quality ones."""
        
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
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Transform focused extraction to blocks and context items"""
        
        blocks = []
        context_items = []
        
        # Create summary block
        blocks.append({
            "semantic_type": "summary",
            "title": f"Summary - {extraction.primary_theme}",
            "content": extraction.summary,
            "confidence_score": extraction.extraction_confidence,
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

        # Transform facts to blocks
        for i, fact in enumerate(extraction.facts[:10]):  # Limit to 10 best facts
            semantic_type = fact_type_map.get(fact.type.lower() if isinstance(fact.type, str) else "", "finding")
            blocks.append({
                "semantic_type": semantic_type,
                "title": f"{fact.type.title()}: {fact.text[:50]}...",
                "content": fact.text,
                "confidence_score": fact.confidence,
                "metadata": {
                    "fact_type": fact.type,
                    "source_hint": fact.source_hint,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_fact"
                }
            })
        
        # Transform insights to blocks
        for i, insight in enumerate(extraction.insights[:8]):  # Limit to 8 best insights
            blocks.append({
                "semantic_type": "insight",
                "title": f"Insight: {insight.insight[:50]}...",
                "content": insight.insight,
                "confidence_score": insight.confidence,
                "metadata": {
                    "supporting_facts": insight.supporting_facts,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_insight"
                }
            })
        
        # Transform actions to blocks
        for i, action in enumerate(extraction.actions[:6]):  # Limit to 6 best actions
            blocks.append({
                "semantic_type": "action",
                "title": f"Action ({action.priority}): {action.action[:50]}...",
                "content": action.action,
                "confidence_score": 0.8,  # Actions are typically high confidence
                "metadata": {
                    "priority": action.priority,
                    "timeline": action.timeline,
                    "owner": action.owner,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_action"
                }
            })
        
        # Transform context to context items
        for ctx in extraction.context[:15]:  # Limit to 15 best context items
            context_items.append({
                "label": ctx.entity,
                "content": f"{ctx.role}: {ctx.details or ''}".strip(),
                "kind": "entity",
                "metadata": {
                    "role": ctx.role,
                    "details": ctx.details,
                    "content_type": content_type,
                    "source_dump_id": str(dump_id),
                    "extraction_method": "focused_context"
                }
            })
        
        # Add content type as context item
        context_items.append({
            "label": f"Content Type: {content_type}",
            "content": f"This content was classified as {content_type} type",
            "kind": "classification",
            "metadata": {
                "content_type": content_type,
                "primary_theme": extraction.primary_theme,
                "extraction_confidence": extraction.extraction_confidence,
                "source_dump_id": str(dump_id),
                "extraction_method": "content_classification"
            }
        })
        
        return blocks, context_items
    
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
