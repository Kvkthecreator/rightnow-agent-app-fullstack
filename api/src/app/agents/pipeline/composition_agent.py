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
            if narrative is None:
                return AgentResponse(
                    success=False,
                    message="Failed to generate narrative structure"
                )
            
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
7. original_intent: The user's original intent (exactly as provided)

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
  "confidence": 0.85,
  "original_intent": "Create comprehensive project timeline"
}}"""

        response = await self.llm.get_json_response(
            prompt,
            temperature=1.0,  # Use default temperature for model compatibility
            schema_name="p4_intent_strategy",
        )
        
        strategy = response.parsed
        if strategy is None:
            logger.error("P4 Intent Analysis failed: No strategy parsed from LLM response")
            raise ValueError("Intent analysis failed - could not parse strategy from LLM response")
        
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
        
        # Query relationships if prioritized (MISSING INTEGRATION!)
        if strategy["substrate_priorities"].get("relationships", True):
            relationships_response = supabase.table("substrate_relationships").select("*")\
                .eq("basket_id", request.basket_id)\
                .execute()
            
            for relationship in relationships_response.data:
                candidates.append({
                    "type": "relationship",
                    "id": relationship["id"],
                    "content": f"Relationship: {relationship.get('from_element_id')} → {relationship.get('relationship_type')} → {relationship.get('to_element_id')}",
                    "relationship_type": relationship.get("relationship_type"),
                    "confidence_score": relationship.get("confidence_score", 0.7),
                    "created_at": relationship["created_at"],
                    "metadata": relationship
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
        def _preview_content(value: Any, limit: int = 500) -> str:
            if value is None:
                return ""
            if isinstance(value, str):
                return value[:limit]
            try:
                return json.dumps(value)[:limit]
            except (TypeError, ValueError):
                return str(value)[:limit]


        def _parse_created_at(raw_value: Any) -> datetime:
            if isinstance(raw_value, datetime):
                return raw_value.astimezone(timezone.utc) if raw_value.tzinfo else raw_value.replace(tzinfo=timezone.utc)
            if isinstance(raw_value, str):
                candidate = raw_value.rstrip("Z")
                try:
                    parsed = datetime.fromisoformat(candidate)
                    return parsed.astimezone(timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
            return datetime(1970, 1, 1, tzinfo=timezone.utc)

        def _fallback_selection(reason: str, limit: int = 5) -> List[Dict[str, Any]]:
            logger.warning(
                "P4 Composition: Falling back to heuristic substrate selection (%s)",
                reason,
            )
            scored = sorted(
                candidates,
                key=lambda item: (
                    item.get("confidence_score", 0.0),
                    _parse_created_at(item.get("created_at")),
                ),
                reverse=True,
            )
            fallback = []
            for source in scored[:limit]:
                chosen = source.copy()
                chosen["selection_reason"] = f"fallback: {reason}"
                fallback.append(chosen)
            logger.info("P4 Composition: Selected %d substrate items via fallback", len(fallback))
            return fallback
        metadata_keys = {"semantic_type", "confidence_score", "kind", "relationship_type"}
        candidates_text = "\n\n".join([
            f"[{i}] Type: {c.get('type', 'unknown')}\n"
            f"Content: {_preview_content(c.get('content'))}...\n"
            f"Created: {c.get('created_at', 'unknown')}\n"
            f"Metadata: {json.dumps({k: v for k, v in c.get('metadata', {}).items() if k in metadata_keys})}"
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
            temperature=1.0,  # Use default temperature for model compatibility
            schema_name="p4_scoring_selection",
        )

        if not response.success or not isinstance(response.parsed, dict):
            return _fallback_selection(response.error or "LLM scoring unavailable")

        selection_result = response.parsed

        # Extract selected substrate
        selected = []
        selected_indices = selection_result.get("selected_indices", [])
        if not isinstance(selected_indices, list):
            return _fallback_selection("Invalid scoring response format")

        for idx in selected_indices:
            if not isinstance(idx, int):
                continue
            if 0 <= idx < len(candidates):
                substrate = candidates[idx].copy()
                # Add selection metadata
                substrate["selection_reason"] = selection_result.get("reasoning", "")
                selected.append(substrate)

        # If no substrate selected, provide explanation
        if not selected and candidates:
            return _fallback_selection("LLM returned no substrate indices")

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
        
        # Prepare substrate summary with relationship context
        substrate_summary, relationship_map = self._prepare_substrate_with_relationships(selected_substrate)
        
        narrative_prompt = f"""Generate a narrative structure for this document using CONNECTED INTELLIGENCE.

Intent: {request.intent}
Document Type: {strategy['document_type']}
Tone: {strategy['tone']}
Organization: {strategy['organization']}

Selected Substrate with Relationships:
{substrate_summary}

IMPORTANT: Use the relationship information to create connected insights, not isolated facts.
Focus on causal chains, temporal sequences, and how concepts build on each other.

Create a JSON structure with:
1. sections: Array of sections, each with:
   - title: Section title
   - content: Brief description emphasizing CONNECTIONS and SYNTHESIS
   - substrate_refs: List of substrate types to reference
   - relationship_focus: How this section uses relationships between concepts
   - order: Section order (0-based)
2. introduction: Opening that explains connections and relationships
3. summary: One-line summary emphasizing insights derived from relationships
4. composition_notes: Notes about what relationships were leveraged and why
5. synthesis_approach: How relationships inform the narrative flow

Example:
{{
  "sections": [
    {{
      "title": "Causal Analysis",
      "content": "How technical decisions led to performance outcomes, based on causal relationships",
      "substrate_refs": ["block", "relationship"],
      "relationship_focus": "causal_relationship chains showing decision → implementation → result",
      "order": 0
    }}
  ],
  "introduction": "This document reveals connected patterns across technical decisions and their cascading effects...",
  "summary": "Analysis revealing causal chains between architecture choices and system performance",
  "composition_notes": "Leveraged 5 causal relationships to show decision impact pathways",
  "synthesis_approach": "Follow causal chains from decisions through implementation to outcomes"
}}"""

        response = await self.llm.get_json_response(
            narrative_prompt,
            temperature=1.0,  # Use default temperature for model compatibility
            schema_name="p4_narrative_structure",
        )
        
        narrative = response.parsed
        if narrative is None:
            logger.error(f"P4 Composition: Failed to generate narrative - LLM returned None")
            return None
            
        logger.info(f"P4 Composition: Generated narrative with {len(narrative.get('sections', []))} sections")
        
        return narrative
    
    def _prepare_substrate_with_relationships(self, selected_substrate: List[Dict[str, Any]]) -> Tuple[str, Dict[str, Any]]:
        """
        Analyze substrate relationships and prepare enhanced context for narrative generation
        """
        # Separate substrate by type
        blocks = [s for s in selected_substrate if s['type'] == 'block']
        context_items = [s for s in selected_substrate if s['type'] == 'context_item']
        dumps = [s for s in selected_substrate if s['type'] == 'dump']
        relationships = [s for s in selected_substrate if s['type'] == 'relationship']
        
        # Build relationship map
        relationship_map = {}
        for rel in relationships:
            rel_type = rel.get('relationship_type', 'related')
            from_id = rel.get('metadata', {}).get('from_element_id')
            to_id = rel.get('metadata', {}).get('to_element_id')
            
            if from_id and to_id:
                if from_id not in relationship_map:
                    relationship_map[from_id] = []
                relationship_map[from_id].append({
                    'to': to_id,
                    'type': rel_type,
                    'confidence': rel.get('confidence_score', 0.7)
                })
        
        # Generate enhanced substrate summary
        summary_parts = []
        
        # Add blocks with their relationships
        if blocks:
            summary_parts.append("=== KNOWLEDGE BLOCKS ===")
            for block in blocks:
                block_id = block['id']
                block_content = f"[BLOCK] {block.get('title', block.get('content', '')[:100])}..."
                
                # Add relationships for this block
                if block_id in relationship_map:
                    relations = relationship_map[block_id]
                    rel_text = "; ".join([f"{r['type']} → {r['to']}" for r in relations[:3]])
                    block_content += f" (Connected: {rel_text})"
                
                summary_parts.append(block_content)
        
        # Add context items
        if context_items:
            summary_parts.append("\n=== CONTEXT ENTITIES ===")
            for item in context_items:
                summary_parts.append(f"[ENTITY] {item.get('content', '')} ({item.get('kind', 'unknown')})")
        
        # Add relationships summary
        if relationships:
            summary_parts.append("\n=== KEY RELATIONSHIPS ===")
            unique_rels = {}
            for rel in relationships:
                rel_type = rel.get('relationship_type', 'related')
                if rel_type not in unique_rels:
                    unique_rels[rel_type] = 0
                unique_rels[rel_type] += 1
            
            for rel_type, count in unique_rels.items():
                summary_parts.append(f"- {count} {rel_type} relationship(s)")
        
        # Add raw dumps if selected
        if dumps:
            summary_parts.append("\n=== RAW MEMORIES ===")
            for dump in dumps[:3]:  # Limit to prevent overwhelming
                summary_parts.append(f"[MEMORY] {dump.get('content', '')[:150]}...")
        
        enhanced_summary = "\n".join(summary_parts)
        
        return enhanced_summary, relationship_map
    
    async def _generate_section_content(
        self,
        section: Dict[str, Any],
        selected_substrate: List[Dict[str, Any]],
        narrative: Dict[str, Any]
    ) -> str:
        """
        Generate detailed content for a section using relationship-aware substrate
        """
        # Get substrate relevant to this section
        relevant_substrate = []
        section_refs = section.get('substrate_refs', [])
        
        for substrate in selected_substrate:
            if substrate['type'] in section_refs:
                relevant_substrate.append(substrate)
        
        # If no specific refs, use all substrate
        if not relevant_substrate:
            relevant_substrate = selected_substrate
        
        # Prepare substrate for content generation
        substrate_context = []
        for sub in relevant_substrate[:8]:  # Limit to prevent context overflow
            sub_info = f"[{sub['type'].upper()}] {sub.get('content', '')[:300]}"
            
            # Add relationship context if available
            if sub['type'] == 'relationship':
                rel_meta = sub.get('metadata', {})
                sub_info += f" (Connects: {rel_meta.get('from_element_id')} → {rel_meta.get('to_element_id')})"
            
            substrate_context.append(sub_info)
        
        substrate_text = "\n\n".join(substrate_context)
        
        # Generate content using relationship focus
        content_prompt = f"""Generate detailed content for this document section using CONNECTED INTELLIGENCE.

Section Title: {section['title']}
Section Purpose: {section['content']}
Relationship Focus: {section.get('relationship_focus', 'Identify connections between concepts')}
Document Intent: {narrative.get('summary', 'Document composition')}
Synthesis Approach: {narrative.get('synthesis_approach', 'Connect related information')}

Relevant Substrate:
{substrate_text}

CRITICAL: Generate 2-4 paragraphs that:
1. Show HOW concepts connect and influence each other
2. Identify CAUSAL relationships (A led to B)
3. Reveal PATTERNS across the information
4. Provide INSIGHTS that emerge from connections, not just facts
5. Use transition phrases like "This led to...", "As a result...", "Building on this..."

Write in a {narrative.get('tone', 'analytical')} tone. Focus on synthesis, not summarization."""

        try:
            response = await self.llm.get_text_response(
                content_prompt,
                temperature=1.0,  # Use default temperature for model compatibility
                max_tokens=800
            )
        except Exception as e:
            logger.warning(f"Failed to generate section content: {e}")
            return section.get('content', 'Content generation failed.')

        if not response.success:
            logger.warning(
                "LLM section generation returned unsuccessful response: %s",
                response.error or "unknown error",
            )
            return section.get('content', 'Content generation failed.')

        generated = response.content.strip()
        if not generated:
            return section.get('content', 'Content generation failed.')

        return generated
    
    async def _compose_document(
        self,
        document_id: str,
        selected_substrate: List[Dict[str, Any]],
        narrative: Dict[str, Any],
        workspace_id: str
    ) -> Dict[str, Any]:
        """
        Compose final document with relationship-aware content and substrate references
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
            
            # Get relationship map for metadata
            _, relationship_map = self._prepare_substrate_with_relationships(selected_substrate)
            
            # Generate relationship-aware section content
            for section in narrative.get("sections", []):
                content_parts.append(f"## {section['title']}")
                content_parts.append("")
                
                # Generate detailed content using relationships
                section_content = await self._generate_section_content(
                    section, selected_substrate, narrative
                )
                content_parts.append(section_content)
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
                    "relationship_map": relationship_map,  # Relationship data for future operations
                    "synthesis_approach": narrative.get("synthesis_approach", "Connected intelligence")
                    # Canon-Pure: substrate_references stored in dedicated table, not metadata
                }
            }
            
            update_response = supabase.table("documents")\
                .update(doc_update)\
                .eq("id", document_id)\
                .execute()
            
            if not update_response.data:
                raise RuntimeError("Failed to update document with composition")
            
            # Canon-Pure: Create substrate references in dedicated table
            substrate_refs_created = []
            for idx, substrate in enumerate(selected_substrate):
                try:
                    # Map substrate type to canonical enum
                    substrate_type_map = {
                        "block": "block",
                        "context_item": "context_item", 
                        "dump": "raw_dump",
                        "raw_dump": "raw_dump",
                        "relationship": "relationship",
                        "timeline_event": "timeline_event"
                    }
                    canonical_type = substrate_type_map.get(substrate["type"], substrate["type"])
                    
                    # Create substrate reference via canonical RPC
                    ref_response = supabase.rpc("fn_document_attach_substrate", {
                        "p_document_id": document_id,
                        "p_substrate_type": canonical_type,
                        "p_substrate_id": substrate["id"],
                        "p_role": "primary" if idx < 5 else "supporting",
                        "p_weight": min(1.0, substrate.get("confidence_score", 0.7)),
                        "p_snippets": [substrate.get("content", "")[:200]] if substrate.get("content") else [],
                        "p_metadata": {
                            "selection_reason": substrate.get("selection_reason", ""),
                            "composition_order": idx,
                            "composition_agent": self.__class__.__name__
                        }
                    }).execute()
                    
                    if ref_response.data:
                        substrate_refs_created.append(ref_response.data)
                        logger.info(f"✅ Created substrate reference: {canonical_type}:{substrate['id']}")
                    else:
                        logger.warning(f"Failed to create substrate reference: {canonical_type}:{substrate['id']}")
                        
                except Exception as e:
                    logger.warning(f"Error creating substrate reference for {substrate['type']}:{substrate['id']}: {e}")
            
            logger.info(f"✅ Canon-pure P4 composition: {len(substrate_refs_created)}/{len(selected_substrate)} substrate references created in canonical table")
            
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
                "substrate_references_created": len(substrate_refs_created),
                "content_length": len(final_content),
                "canon_compliance": "substrate_references_in_canonical_table"
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