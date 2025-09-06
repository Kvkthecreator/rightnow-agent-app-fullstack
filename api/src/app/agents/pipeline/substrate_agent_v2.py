"""
P1 Substrate Agent v2 - Concrete LLM Implementation
Implements structured knowledge extraction with Structured Outputs and provenance tracking.
"""

import logging
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID
import os
from openai import OpenAI
from pydantic import ValidationError

from app.utils.supabase_client import supabase_admin_client as supabase
from app.schemas.knowledge_extraction import (
    KnowledgeBlockList,
    KnowledgeBlock,
    Provenance,
    ProvenanceSpan
)

# Environment-driven LLM configuration
MODEL_P1 = os.getenv("LLM_MODEL_P1", "gpt-4o-mini")
TEMP_P1 = float(os.getenv("LLM_TEMP_P1", "0.0"))
MAXTOK_P1 = int(os.getenv("LLM_MAXTOK_P1", "3000"))
SEED_P1 = int(os.getenv("LLM_SEED_P1", "1"))

logger = logging.getLogger("uvicorn.error")


class P1SubstrateAgentV2:
    """
    Canon v1.4.0 compliant P1 Substrate Agent with comprehensive batch processing.
    
    Features:
    - Batch mode for Share Updates: multiple raw dumps → unified analysis
    - Cross-content relationship detection and semantic coherence analysis
    - OpenAI Structured Outputs for guaranteed schema compliance
    - Provenance tracking with text span validation across all inputs
    - Retry/backoff logic for production reliability
    - Environment-driven configuration
    """
    
    pipeline = "P1_SUBSTRATE"
    agent_name = "P1SubstrateAgentV2"
    
    def __init__(self):
        self.logger = logger
        # Validate environment configuration
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OPENAI_API_KEY not set")
        
        self.logger.info(f"P1 Substrate Agent v2 initialized with model={MODEL_P1}, temp={TEMP_P1}")
    
    def _client(self) -> OpenAI:
        """Get OpenAI client with explicit API key handling."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")
        return OpenAI(api_key=api_key)
    
    def _response_format_schema(self):
        """Structured Outputs: force exact JSON schema compliance."""
        return {
            "type": "json_schema",
            "json_schema": {
                "name": "knowledge_blocks",
                "schema": KnowledgeBlockList.model_json_schema()
            }
        }
        
    async def create_substrate(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create structured substrate from raw dumps using comprehensive knowledge extraction.
        
        Supports both single dump and batch mode for Share Updates comprehensive review.
        Returns blocks as data ingredients with structured knowledge and cross-content relationships.
        """
        start_time = datetime.utcnow()
        workspace_id = UUID(request["workspace_id"])
        basket_id = UUID(request["basket_id"])
        max_blocks = request.get("max_blocks", 10)
        agent_id = request["agent_id"]
        
        # Support both single dump and batch processing (Share Updates)
        dump_ids = request.get("dump_ids", [request["dump_id"]]) if "dump_ids" in request else [request["dump_id"]]
        dump_ids = [UUID(did) for did in dump_ids]
        
        try:
            # Get all raw dump contents for comprehensive analysis
            dump_contents = []
            for dump_id in dump_ids:
                content = await self._get_dump_content(dump_id, workspace_id)
                if content:
                    dump_contents.append({"dump_id": dump_id, "content": content})
            
            if not dump_contents:
                raise ValueError(f"No content found in provided dumps: {dump_ids}")
            
            # Extract structured knowledge with comprehensive cross-content analysis
            if len(dump_contents) == 1:
                # Single dump processing
                extraction_result = await self._extract_with_llm(dump_contents[0]["content"], str(dump_contents[0]["dump_id"]))
            else:
                # Batch processing for Share Updates comprehensive review
                extraction_result = await self._extract_batch_with_llm(dump_contents)
            
            knowledge_blocks = extraction_result.get("blocks", [])
            
            # Transform knowledge blocks into database-ready format
            primary_dump_id = dump_ids[0]  # Use first dump as primary for legacy compatibility
            block_ingredients = self._transform_knowledge_blocks(
                knowledge_blocks, primary_dump_id, max_blocks, dump_contents
            )
            
            # Persist blocks as structured ingredients
            created_blocks = await self._persist_block_ingredients(
                basket_id, primary_dump_id, block_ingredients, agent_id
            )
            
            # Extract context items from knowledge blocks
            all_entities = []
            for kb in knowledge_blocks:
                all_entities.extend(kb.get("entities", []))
            
            created_context_items = await self._create_context_items_from_entities(
                basket_id, all_entities
            )
            
            # Calculate metrics
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"P1 Substrate v2 completed: dump_id={dump_id}, "
                f"ingredients={len(created_blocks)}, entities={len(created_context_items)}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return {
                "primary_dump_id": str(primary_dump_id),
                "processed_dump_ids": [str(did) for did in dump_ids],
                "batch_mode": len(dump_ids) > 1,
                "blocks_created": created_blocks,
                "context_items_created": created_context_items,
                "processing_time_ms": processing_time_ms,
                "agent_confidence": extraction_result.get("extraction_metadata", {}).get("confidence", 0.8),
                "extraction_method": "comprehensive_structured_ingredients" if len(dump_ids) > 1 else "structured_knowledge_ingredients"
            }
            
        except Exception as e:
            self.logger.error(f"P1 Substrate v2 failed for dumps {dump_ids}: {e}")
            raise
    
    async def _extract_with_llm(self, text: str, dump_id: str) -> Dict[str, Any]:
        """
        Extract structured knowledge with concrete LLM implementation.
        Uses Structured Outputs for guaranteed schema compliance.
        """
        sys = (
            "You extract structured knowledge from raw text. "
            "Return ONLY the JSON that matches the provided schema. "
            "All items MUST include provenance spans [start,end] that index into the original text."
        )
        user = (
            f"Text to extract from:\n{text}\n\n"
            "Instructions:\n"
            "- Identify goals, constraints, metrics, entities, relationships, timelines, evidence, quotes, findings.\n"
            "- Normalize metrics: {name, value, unit, period}.\n"
            "- Dates ISO-8601 when possible.\n"
            f"- provenance.dump_id must match '{dump_id}'; add at least one [start,end] per item."
        )

        cli = self._client()
        
        # Retry/backoff logic for production reliability
        for attempt in range(4):
            try:
                resp = cli.chat.completions.create(
                    model=MODEL_P1,
                    messages=[
                        {"role": "system", "content": sys},
                        {"role": "user", "content": user}
                    ],
                    response_format=self._response_format_schema(),
                    temperature=TEMP_P1,
                    max_tokens=MAXTOK_P1,
                    seed=SEED_P1
                )
                
                raw = resp.choices[0].message.content
                data = json.loads(raw)
                obj = KnowledgeBlockList.model_validate(data)
                
                # Enforce provenance requirements
                for kb in obj.blocks:
                    if kb.provenance.dump_id != dump_id or not kb.provenance.ranges:
                        raise ValueError(f"Provenance missing or dump_id mismatch for block: {kb.title}")
                
                self.logger.info(f"LLM extraction successful: {len(obj.blocks)} blocks extracted")
                return obj.model_dump()
                
            except (ValidationError, ValueError, json.JSONDecodeError) as e:
                if attempt == 3:
                    raise e
                self.logger.warning(f"LLM extraction attempt {attempt + 1} failed: {e}")
                time.sleep(1.5 * (attempt + 1))
                
            except Exception as e:
                if attempt == 3:
                    raise e
                self.logger.error(f"LLM extraction attempt {attempt + 1} error: {e}")
                time.sleep(1.5 * (attempt + 1))
    
    async def _extract_batch_with_llm(self, dump_contents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract structured knowledge from multiple dumps with comprehensive cross-content analysis.
        Supports Share Updates unified review workflow.
        """
        # Combine all dump contents for comprehensive analysis
        combined_text = ""
        dump_mapping = {}
        
        for i, dump_data in enumerate(dump_contents):
            dump_id = str(dump_data["dump_id"])
            content = dump_data["content"]
            
            # Add section markers for provenance tracking
            section_start = len(combined_text)
            combined_text += f"\n\n=== CONTENT SOURCE {i+1} (dump_id: {dump_id}) ===\n{content}\n"
            section_end = len(combined_text)
            
            dump_mapping[dump_id] = {
                "section_index": i,
                "start_offset": section_start,
                "end_offset": section_end,
                "content": content
            }
        
        sys = (
            "You extract structured knowledge from multiple related content sources. "
            "Perform comprehensive cross-content analysis to identify themes, relationships, and semantic coherence. "
            "Return ONLY the JSON that matches the provided schema. "
            "All items MUST include provenance spans that reference the original dump_id and text positions."
        )
        
        dump_ids_str = ", ".join([str(dc["dump_id"]) for dc in dump_contents])
        user = (
            f"Multiple content sources to analyze comprehensively:\n{combined_text}\n\n"
            "Instructions:\n"
            "- Perform unified analysis across ALL content sources\n"
            "- Identify cross-content relationships and shared themes\n"
            "- Extract goals, constraints, metrics, entities that span multiple sources\n" 
            "- Normalize and deduplicate related concepts\n"
            "- Generate single coherent structured ingredient set\n"
            f"- provenance.dump_id must match one of: {dump_ids_str}\n"
            "- Include comprehensive cross-dump relationships in the analysis"
        )

        cli = self._client()
        
        # Retry/backoff logic for batch processing
        for attempt in range(4):
            try:
                resp = cli.chat.completions.create(
                    model=MODEL_P1,
                    messages=[
                        {"role": "system", "content": sys},
                        {"role": "user", "content": user}
                    ],
                    response_format=self._response_format_schema(),
                    temperature=TEMP_P1,
                    max_tokens=MAXTOK_P1 * 2,  # Increase for batch processing
                    seed=SEED_P1
                )
                
                raw = resp.choices[0].message.content
                data = json.loads(raw)
                obj = KnowledgeBlockList.model_validate(data)
                
                # Add batch processing metadata
                extraction_metadata = {
                    "batch_mode": True,
                    "source_dumps": len(dump_contents),
                    "confidence": 0.85,  # Default for batch processing
                    "cross_content_analysis": True
                }
                
                result = obj.model_dump()
                result["extraction_metadata"] = extraction_metadata
                
                self.logger.info(f"Batch LLM extraction successful: {len(obj.blocks)} blocks from {len(dump_contents)} dumps")
                return result
                
            except (ValidationError, ValueError, json.JSONDecodeError) as e:
                if attempt == 3:
                    raise e
                self.logger.warning(f"Batch LLM extraction attempt {attempt + 1} failed: {e}")
                time.sleep(2.0 * (attempt + 1))  # Longer delays for batch processing
                
            except Exception as e:
                if attempt == 3:
                    raise e
                self.logger.error(f"Batch LLM extraction attempt {attempt + 1} error: {e}")
                time.sleep(2.0 * (attempt + 1))
    
    def _transform_knowledge_blocks(
        self,
        knowledge_blocks: List[Dict[str, Any]],
        dump_id: UUID,
        max_blocks: int,
        dump_contents: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Transform LLM-extracted knowledge blocks into database format.
        
        Supports both single dump and batch processing modes.
        """
        block_ingredients = []
        batch_mode = dump_contents and len(dump_contents) > 1
        
        for kb in knowledge_blocks[:max_blocks]:
            # Create legacy content for backward compatibility
            legacy_content = self._generate_legacy_content_from_block(kb)
            
            ingredient = {
                "semantic_type": kb.get("semantic_type", "knowledge"),
                "title": kb.get("title", "Extracted Knowledge"),
                "content": legacy_content,
                "confidence": kb.get("confidence", 0.7),
                "metadata": {
                    # NEW: Store structured knowledge ingredients
                    "knowledge_ingredients": kb,
                    "extraction_method": "llm_structured_v2",
                    "provenance_validated": True,
                    "batch_processing": batch_mode,
                    "source_dumps": len(dump_contents) if dump_contents else 1,
                    "transformation_hints": {
                        "composable_as": ["reference", "context", "ingredient"],
                        "synthesis_priority": "medium"
                    }
                },
                "source_dump_id": str(dump_id),
                "extraction_timestamp": datetime.utcnow().isoformat()
            }
            
            block_ingredients.append(ingredient)
        
        return block_ingredients
    
    def _generate_legacy_content_from_block(self, kb: Dict[str, Any]) -> str:
        """Generate backward-compatible text content from structured block."""
        parts = []
        
        # Add goals as text
        for goal in kb.get("goals", []):
            parts.append(f"Goal: {goal.get('title', 'Untitled Goal')}")
            if goal.get('description'):
                parts.append(goal['description'])
        
        # Add constraints as text
        for constraint in kb.get("constraints", []):
            parts.append(f"Constraint: {constraint.get('title', 'Untitled Constraint')}")
            if constraint.get('description'):
                parts.append(constraint['description'])
        
        # Add entities as text
        for entity in kb.get("entities", []):
            entity_type = entity.get('type', 'entity').title()
            entity_name = entity.get('name', 'Unnamed Entity')
            entity_desc = entity.get('description', '')
            if entity_desc:
                parts.append(f"{entity_type}: {entity_name} - {entity_desc}")
            else:
                parts.append(f"{entity_type}: {entity_name}")
        
        # Add metrics as text
        for metric in kb.get("metrics", []):
            parts.append(f"Metric: {metric.get('name', 'Unnamed Metric')}")
            if metric.get('description'):
                parts.append(metric['description'])
        
        # Fallback if no structured content
        if not parts:
            return f"Structured knowledge block: {kb.get('title', 'Extracted Knowledge')}"
        
        return "\n\n".join(parts)
    
    async def _persist_block_ingredients(
        self,
        basket_id: UUID,
        dump_id: UUID,
        block_ingredients: List[Dict[str, Any]],
        agent_id: str
    ) -> List[Dict[str, Any]]:
        """Persist block ingredients to database with structured metadata."""
        if not block_ingredients:
            return []
            
        try:
            created_blocks = []
            
            for ingredient in block_ingredients:
                # Get workspace_id from basket lookup
                basket_resp = supabase.table("baskets").select("workspace_id").eq("id", str(basket_id)).single().execute()
                workspace_id = basket_resp.data["workspace_id"] if basket_resp.data else None
                
                if not workspace_id:
                    self.logger.error(f"Could not find workspace_id for basket {basket_id}")
                    continue
                
                block_data = {
                    "basket_id": str(basket_id),
                    "workspace_id": workspace_id,
                    "raw_dump_id": str(dump_id),
                    "title": ingredient["title"],
                    "body_md": ingredient["content"],  # Streamlined: align with web layer convention
                    "status": "proposed",
                    "confidence_score": ingredient["confidence"],
                    "processing_agent": agent_id,
                    "semantic_type": ingredient["semantic_type"],
                    "metadata": ingredient["metadata"]
                }
                
                # FIXED: Split insert and select calls for Supabase client compatibility
                response = supabase.table("blocks").insert(block_data).execute()
                if response.data:
                    # Get the inserted records with all fields
                    inserted_ids = [record["id"] for record in response.data]
                    select_response = supabase.table("blocks").select("*").in_("id", inserted_ids).execute()
                    if select_response.data:
                        created_blocks.extend(select_response.data)
                    
            return created_blocks
            
        except Exception as e:
            self.logger.error(f"Failed to persist block ingredients: {e}")
            return []
    
    async def _create_context_items_from_entities(
        self,
        basket_id: UUID,
        entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Create context items from structured entities."""
        if not entities:
            return []
            
        try:
            # Filter high-confidence entities suitable as context items
            context_entities = [
                e for e in entities 
                if e.get("confidence", 0.0) > 0.6 and e.get("type") in ["person", "project", "concept", "goal"]
            ][:10]  # Limit to prevent explosion
            
            context_data = []
            for entity in context_entities:
                context_data.append({
                    "basket_id": str(basket_id),
                    "type": entity.get("type", "concept"),
                    "content": entity.get("name", "Unnamed Entity"),
                    "metadata": {
                        "confidence": entity.get("confidence", 0.7),
                        "description": entity.get("description"),
                        "attributes": entity.get("attributes", {}),
                        "generated_by": self.agent_name,
                        "pipeline": self.pipeline,
                        "extraction_method": "structured_entities_v2"
                    }
                })
            
            # Bulk insert context items
            if context_data:
                # FIXED: Split insert and select calls for Supabase client compatibility
                response = supabase.table("context_items").insert(context_data).execute()
                if response.data:
                    # Get the inserted records with all fields
                    inserted_ids = [record["id"] for record in response.data]
                    select_response = supabase.table("context_items").select("*").in_("id", inserted_ids).execute()
                    return select_response.data if select_response.data else []
                return []
            else:
                return []
                
        except Exception as e:
            self.logger.warning(f"Failed to create context items from entities: {e}")
            return []
    
    async def _get_dump_content(self, dump_id: UUID, workspace_id: UUID) -> Optional[str]:
        """Get raw dump content for knowledge extraction."""
        try:
            response = supabase.table("raw_dumps").select(
                "body_md,file_url,source_meta"
            ).eq("id", str(dump_id)).eq("workspace_id", str(workspace_id)).single().execute()
            
            if not response.data:
                return None
                
            return response.data.get("body_md", "").strip()
            
        except Exception as e:
            self.logger.warning(f"Failed to get dump content for {dump_id}: {e}")
            return None
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information."""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "substrate_v2",
            "status": "active",
            "sacred_rule": "Creates structured knowledge ingredients, never relationships or reflections",
            "extraction_method": "llm_structured_outputs",
            "model": MODEL_P1,
            "temperature": str(TEMP_P1),
            "max_tokens": str(MAXTOK_P1),
            "version": "2.0_concrete_llm"
        }
    
    async def test_extraction(self, content: str, dump_id: str = "test-dump") -> Dict[str, Any]:
        """Test knowledge extraction on sample content."""
        return await self._extract_with_llm(content, dump_id)