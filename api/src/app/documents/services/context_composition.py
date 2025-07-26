"""Core context-driven document composition service."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4

from ...models.document import (
    Document, DocumentType, CompositionMethod, CompositionIntelligence,
    NarrativeMetadata, DocumentCoherence, BlockReference, DocumentSection
)
from ...schemas.document_composition_schema import (
    ContextDrivenCompositionRequest, CompositionFromIntentRequest,
    ContextDrivenDocument, DiscoveredBlock, CompositionContext,
    NarrativeIntelligence
)
from ...context.services.composition_intelligence import CompositionIntelligenceService
from ...context.services.context_discovery import ContextDiscoveryService
from ...context.services.intent_analyzer import IntentAnalyzerService
from ...context.services.context_hierarchy import ContextHierarchyService
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json

logger = logging.getLogger("uvicorn.error")


class ContextCompositionService:
    """Core service for context-driven document composition."""
    
    @classmethod
    async def compose_contextual_document(
        cls,
        request: ContextDrivenCompositionRequest,
        workspace_id: str,
        created_by: Optional[str] = None
    ) -> ContextDrivenDocument:
        """Create a document driven by context DNA."""
        
        # Step 1: Analyze composition intelligence
        composition_analysis = await CompositionIntelligenceService.analyze_composition_intelligence(
            basket_id=request.basket_id,
            workspace_id=workspace_id,
            analysis_focus="comprehensive"
        )
        
        # Step 2: Build composition context from request and analysis
        composition_context = await cls._build_composition_context(
            request, composition_analysis, workspace_id
        )
        
        # Step 3: Discover relevant blocks using context intelligence
        discovered_blocks = await cls._discover_composition_blocks(
            request, composition_context, workspace_id
        )
        
        # Step 4: Generate document structure and content
        document_content, narrative_intelligence = await cls._generate_contextual_content(
            request, composition_context, discovered_blocks
        )
        
        # Step 5: Calculate coherence and create document
        coherence_score = cls._calculate_context_coherence(
            composition_context, discovered_blocks, document_content
        )
        
        # Step 6: Create and persist document
        document = await cls._create_contextual_document(
            request=request,
            composition_context=composition_context,
            discovered_blocks=discovered_blocks,
            document_content=document_content,
            narrative_intelligence=narrative_intelligence,
            coherence_score=coherence_score,
            workspace_id=workspace_id,
            created_by=created_by
        )
        
        # Step 7: Log composition event
        await cls._log_composition_event(document, request, workspace_id)
        
        return ContextDrivenDocument(
            id=document.id,
            title=document.title,
            content_raw=document.content_raw,
            content_rendered=document.content_rendered,
            composition_context=CompositionContext(**composition_context),
            discovered_blocks=discovered_blocks,
            narrative_intelligence=narrative_intelligence,
            context_coherence_score=coherence_score,
            document_sections=[
                {
                    "section_id": section.section_id,
                    "title": section.title,
                    "content": section.content,
                    "section_type": section.section_type,
                    "context_alignment": section.context_alignment,
                    "contributing_blocks": section.contributing_blocks,
                    "contributing_contexts": section.contributing_contexts,
                    "generation_metadata": section.generation_metadata
                }
                for section in document.sections
            ],
            composition_metadata=document.composition_metadata,
            created_at=document.created_at,
            updated_at=document.updated_at,
            created_by_agent=document.created_by_agent,
            workspace_id=document.workspace_id,
            basket_id=document.basket_id
        )
    
    @classmethod
    async def compose_from_intent(
        cls,
        request: CompositionFromIntentRequest,
        workspace_id: str,
        created_by: Optional[str] = None
    ) -> ContextDrivenDocument:
        """Create document based on detected composition intent."""
        
        # Convert intent-based request to contextual request
        contextual_request = await cls._convert_intent_to_contextual_request(
            request, workspace_id
        )
        
        # Use standard contextual composition
        return await cls.compose_contextual_document(
            contextual_request, workspace_id, created_by
        )
    
    @classmethod
    async def _build_composition_context(
        cls,
        request: ContextDrivenCompositionRequest,
        composition_analysis,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Build comprehensive composition context from request and analysis."""
        
        # Get context hierarchy if primary contexts specified
        if request.primary_context_ids:
            # Get specified primary contexts
            primary_contexts = await cls._get_contexts_by_ids(
                request.primary_context_ids, workspace_id
            )
        else:
            # Use analysis to determine primary contexts
            hierarchy = await ContextHierarchyService.analyze_context_hierarchy(
                request.basket_id, workspace_id
            )
            primary_contexts = [ctx.model_dump() for ctx in hierarchy.primary_contexts]
        
        # Get hierarchy for secondary and supporting contexts
        hierarchy = await ContextHierarchyService.analyze_context_hierarchy(
            request.basket_id, workspace_id
        )
        
        secondary_contexts = [ctx.model_dump() for ctx in hierarchy.secondary_contexts]
        supporting_contexts = [ctx.model_dump() for ctx in hierarchy.supporting_contexts] if request.include_supporting_contexts else []
        
        # Determine composition intent
        detected_intent = request.composition_intent or composition_analysis.intent_analysis.primary_intent
        intent_confidence = composition_analysis.intent_analysis.intent_confidence
        
        # Determine audience and style
        target_audience = request.target_audience or (
            composition_analysis.intent_analysis.audience_indicators[0] 
            if composition_analysis.intent_analysis.audience_indicators else None
        )
        
        composition_style = request.style_preference or (
            composition_analysis.intent_analysis.style_indicators[0]
            if composition_analysis.intent_analysis.style_indicators else None
        )
        
        # Determine scope
        composition_scope = (
            composition_analysis.intent_analysis.scope_indicators[0]
            if composition_analysis.intent_analysis.scope_indicators else "overview"
        )
        
        return {
            "primary_contexts": primary_contexts,
            "secondary_contexts": secondary_contexts,
            "supporting_contexts": supporting_contexts,
            "detected_intent": detected_intent,
            "intent_confidence": intent_confidence,
            "target_audience": target_audience,
            "composition_style": composition_style,
            "composition_scope": composition_scope,
            "hierarchy_strength": hierarchy.composition_score,
            "context_coherence": composition_analysis.overall_composition_readiness
        }
    
    @classmethod
    async def _discover_composition_blocks(
        cls,
        request: ContextDrivenCompositionRequest,
        composition_context: Dict[str, Any],
        workspace_id: str
    ) -> List[DiscoveredBlock]:
        """Discover blocks relevant to the composition context."""
        
        discovered_blocks = []
        
        # Get all context IDs for discovery
        all_context_ids = []
        for ctx_list in [
            composition_context.get("primary_contexts", []),
            composition_context.get("secondary_contexts", []),
            composition_context.get("supporting_contexts", [])
        ]:
            all_context_ids.extend([UUID(ctx["id"]) for ctx in ctx_list])
        
        if not all_context_ids:
            # Fallback: discover by intent if no contexts available
            if composition_context.get("detected_intent"):
                discovery_result = await ContextDiscoveryService.discover_composition_relevant_memory(
                    basket_id=request.basket_id,
                    composition_intent=composition_context["detected_intent"],
                    workspace_id=workspace_id,
                    max_results=request.max_blocks
                )
                
                for block_score in discovery_result.discovered_blocks:
                    discovered_blocks.append(DiscoveredBlock(
                        block_id=block_score.block_id,
                        content=await cls._get_block_content(block_score.block_id, workspace_id),
                        semantic_type=await cls._get_block_semantic_type(block_score.block_id, workspace_id),
                        state=await cls._get_block_state(block_score.block_id, workspace_id),
                        relevance_score=block_score.relevance_score,
                        context_alignment=block_score.context_alignment,
                        composition_value=block_score.composition_value,
                        discovery_reasoning=block_score.reasoning,
                        contributing_contexts=block_score.contributing_contexts
                    ))
        else:
            # Use context-driven discovery
            from ...schemas.context_composition_schema import ContextDiscoveryRequest
            
            discovery_request = ContextDiscoveryRequest(
                basket_id=request.basket_id,
                target_contexts=all_context_ids,
                discovery_scope="blocks",
                include_related=True,
                max_results=request.max_blocks,
                min_relevance_threshold=0.3,
                workspace_id=workspace_id
            )
            
            discovery_result = await ContextDiscoveryService.discover_relevant_blocks(
                discovery_request, workspace_id
            )
            
            for block_score in discovery_result.discovered_blocks:
                block_details = await cls._get_block_details(block_score.block_id, workspace_id)
                
                discovered_blocks.append(DiscoveredBlock(
                    block_id=block_score.block_id,
                    content=block_details.get("content", ""),
                    semantic_type=block_details.get("semantic_type", "insight"),
                    state=block_details.get("state", "PROPOSED"),
                    relevance_score=block_score.relevance_score,
                    context_alignment=block_score.context_alignment,
                    composition_value=block_score.composition_value,
                    discovery_reasoning=block_score.reasoning,
                    contributing_contexts=block_score.contributing_contexts
                ))
        
        # Sort by relevance score
        discovered_blocks.sort(key=lambda x: x.relevance_score, reverse=True)
        
        return discovered_blocks
    
    @classmethod
    async def _generate_contextual_content(
        cls,
        request: ContextDrivenCompositionRequest,
        composition_context: Dict[str, Any],
        discovered_blocks: List[DiscoveredBlock]
    ) -> Tuple[str, NarrativeIntelligence]:
        """Generate document content based on context and discovered blocks."""
        
        # Import here to avoid circular imports
        from .narrative_intelligence import NarrativeIntelligenceService
        
        # Generate title if not provided
        title = request.title or cls._generate_contextual_title(
            composition_context, discovered_blocks
        )
        
        # Organize blocks by sections based on context and intent
        section_organization = cls._organize_blocks_by_sections(
            composition_context, discovered_blocks
        )
        
        # Generate narrative intelligence
        narrative_intelligence = await NarrativeIntelligenceService.generate_contextual_narrative(
            composition_context=composition_context,
            discovered_blocks=discovered_blocks,
            section_organization=section_organization,
            custom_instructions=request.custom_instructions
        )
        
        # Generate content using narrative intelligence
        content = await NarrativeIntelligenceService.compose_document_content(
            title=title,
            composition_context=composition_context,
            discovered_blocks=discovered_blocks,
            section_organization=section_organization,
            narrative_intelligence=narrative_intelligence
        )
        
        return content, narrative_intelligence
    
    @classmethod
    def _generate_contextual_title(
        cls,
        composition_context: Dict[str, Any],
        discovered_blocks: List[DiscoveredBlock]
    ) -> str:
        """Generate document title based on context and intent."""
        
        intent = composition_context.get("detected_intent", "general_composition")
        audience = composition_context.get("target_audience", "general")
        
        # Extract key themes from primary contexts
        primary_contexts = composition_context.get("primary_contexts", [])
        themes = []
        
        for ctx in primary_contexts[:2]:  # Use top 2 primary contexts
            content = ctx.get("content", "")
            # Simple keyword extraction (could be enhanced with NLP)
            words = content.lower().split()
            key_words = [w for w in words if len(w) > 4 and w.isalpha()][:3]
            themes.extend(key_words)
        
        # Generate title based on intent and themes
        if intent == "strategic_analysis":
            base_title = "Strategic Analysis"
        elif intent == "technical_guide":
            base_title = "Technical Guide"
        elif intent == "executive_summary":
            base_title = "Executive Summary"
        elif intent == "action_plan":
            base_title = "Action Plan"
        else:
            base_title = "Analysis"
        
        # Add theme context if available
        if themes:
            theme_suffix = f": {' '.join(themes[:2]).title()}"
            return f"{base_title}{theme_suffix}"
        
        return base_title
    
    @classmethod
    def _organize_blocks_by_sections(
        cls,
        composition_context: Dict[str, Any],
        discovered_blocks: List[DiscoveredBlock]
    ) -> Dict[str, List[DiscoveredBlock]]:
        """Organize discovered blocks into document sections."""
        
        intent = composition_context.get("detected_intent", "general_composition")
        
        # Define section structures by intent
        section_structures = {
            "strategic_analysis": ["introduction", "analysis", "opportunities", "recommendations"],
            "technical_guide": ["overview", "prerequisites", "implementation", "examples"],
            "executive_summary": ["overview", "key_findings", "recommendations"],
            "action_plan": ["objectives", "action_items", "timeline", "resources"],
            "research_report": ["background", "methodology", "findings", "conclusions"]
        }
        
        sections = section_structures.get(intent, ["overview", "main_content", "conclusion"])
        
        # Organize blocks by semantic type and relevance
        organized = {section: [] for section in sections}
        
        # Simple organization logic (could be enhanced with ML)
        for block in discovered_blocks:
            semantic_type = block.semantic_type
            
            if semantic_type == "goal" and "objectives" in sections:
                organized["objectives"].append(block)
            elif semantic_type == "goal" and "overview" in sections:
                organized["overview"].append(block)
            elif semantic_type == "insight" and "analysis" in sections:
                organized["analysis"].append(block)
            elif semantic_type == "insight" and "findings" in sections:
                organized["findings"].append(block)
            elif semantic_type == "constraint" and "prerequisites" in sections:
                organized["prerequisites"].append(block)
            elif semantic_type == "constraint" and "resources" in sections:
                organized["resources"].append(block)
            else:
                # Default to main content section
                main_section = sections[1] if len(sections) > 1 else sections[0]
                organized[main_section].append(block)
        
        return organized
    
    @classmethod
    def _calculate_context_coherence(
        cls,
        composition_context: Dict[str, Any],
        discovered_blocks: List[DiscoveredBlock],
        document_content: str
    ) -> float:
        """Calculate overall coherence score for the composed document."""
        
        factors = []
        
        # Intent confidence factor
        factors.append(composition_context.get("intent_confidence", 0.0))
        
        # Context coverage factor
        primary_count = len(composition_context.get("primary_contexts", []))
        secondary_count = len(composition_context.get("secondary_contexts", []))
        context_factor = min((primary_count + secondary_count * 0.5) / 3, 1.0)
        factors.append(context_factor)
        
        # Block relevance factor
        if discovered_blocks:
            avg_relevance = sum(block.relevance_score for block in discovered_blocks) / len(discovered_blocks)
            factors.append(avg_relevance)
        
        # Hierarchy strength factor
        factors.append(composition_context.get("hierarchy_strength", 0.0))
        
        # Content coherence (simple length-based heuristic)
        content_factor = min(len(document_content) / 1000, 1.0)  # Longer content = more coherent
        factors.append(content_factor)
        
        return sum(factors) / len(factors) if factors else 0.0
    
    @classmethod
    async def _create_contextual_document(
        cls,
        request: ContextDrivenCompositionRequest,
        composition_context: Dict[str, Any],
        discovered_blocks: List[DiscoveredBlock],
        document_content: str,
        narrative_intelligence: NarrativeIntelligence,
        coherence_score: float,
        workspace_id: str,
        created_by: Optional[str] = None
    ) -> Document:
        """Create and persist the contextual document."""
        
        document_id = uuid4()
        title = request.title or cls._generate_contextual_title(composition_context, discovered_blocks)
        
        # Build composition intelligence
        composition_intel = CompositionIntelligence(
            primary_contexts=[UUID(ctx["id"]) for ctx in composition_context.get("primary_contexts", [])],
            secondary_contexts=[UUID(ctx["id"]) for ctx in composition_context.get("secondary_contexts", [])],
            supporting_contexts=[UUID(ctx["id"]) for ctx in composition_context.get("supporting_contexts", [])],
            detected_intent=composition_context.get("detected_intent"),
            intent_confidence=composition_context.get("intent_confidence", 0.0),
            target_audience=composition_context.get("target_audience"),
            composition_style=composition_context.get("composition_style"),
            composition_scope=composition_context.get("composition_scope"),
            hierarchy_strength=composition_context.get("hierarchy_strength", 0.0),
            context_coherence=composition_context.get("context_coherence", 0.0),
            composition_method=CompositionMethod.CONTEXT_DRIVEN
        )
        
        # Build narrative metadata
        narrative_meta = NarrativeMetadata(
            generation_approach=narrative_intelligence.generation_approach,
            narrative_style=narrative_intelligence.narrative_style,
            structure_type=narrative_intelligence.structure_type,
            audience_adaptation=narrative_intelligence.audience_adaptation,
            style_elements=narrative_intelligence.style_elements,
            content_organization=narrative_intelligence.content_organization,
            generation_confidence=narrative_intelligence.generation_confidence,
            enhancement_suggestions=narrative_intelligence.enhancement_suggestions
        )
        
        # Build document coherence
        doc_coherence = DocumentCoherence(
            overall_coherence_score=coherence_score,
            context_coverage=len(discovered_blocks) / max(request.max_blocks, 1),
            intent_alignment=composition_context.get("intent_confidence", 0.0),
            audience_appropriateness=0.8 if composition_context.get("target_audience") else 0.5,
            style_consistency=narrative_intelligence.generation_confidence,
            content_coherence=coherence_score
        )
        
        # Build block references
        block_refs = [
            BlockReference(
                block_id=block.block_id,
                relevance_score=block.relevance_score,
                context_alignment=block.context_alignment,
                composition_value=block.composition_value,
                discovery_reasoning=block.discovery_reasoning,
                contributing_contexts=block.contributing_contexts,
                section_placement=block.section_placement
            )
            for block in discovered_blocks
        ]
        
        # Create document
        document = Document(
            id=document_id,
            title=title,
            content_raw=document_content,
            content_rendered=document_content,  # Would be processed in real implementation
            document_type=DocumentType(composition_context.get("detected_intent", "general_composition"))
            if composition_context.get("detected_intent") in [dt.value for dt in DocumentType]
            else DocumentType.GENERAL_COMPOSITION,
            workspace_id=workspace_id,
            basket_id=request.basket_id,
            created_by=created_by,
            composition_intelligence=composition_intel,
            narrative_metadata=narrative_meta,
            document_coherence=doc_coherence,
            block_references=block_refs,
            last_composed_at=datetime.utcnow(),
            composition_metadata={
                "composition_request": request.model_dump(),
                "composition_context": composition_context,
                "narrative_intelligence": narrative_intelligence.model_dump()
            }
        )
        
        # Persist to database
        document_data = document.model_dump()
        document_data["id"] = str(document_data["id"])
        document_data["basket_id"] = str(document_data["basket_id"])
        
        # Convert nested objects to JSON
        document_data = as_json(document_data)
        
        supabase.table("documents").insert(document_data).execute()
        
        return document
    
    @classmethod
    async def _convert_intent_to_contextual_request(
        cls,
        request: CompositionFromIntentRequest,
        workspace_id: str
    ) -> ContextDrivenCompositionRequest:
        """Convert intent-based request to contextual composition request."""
        
        # Analyze composition intelligence to find relevant contexts
        composition_analysis = await CompositionIntelligenceService.analyze_composition_intelligence(
            basket_id=request.basket_id,
            workspace_id=workspace_id
        )
        
        # Find contexts related to the detected intent
        hierarchy = await ContextHierarchyService.analyze_context_hierarchy(
            request.basket_id, workspace_id
        )
        
        # Use primary contexts as drivers
        primary_context_ids = [ctx.id for ctx in hierarchy.primary_contexts]
        
        return ContextDrivenCompositionRequest(
            basket_id=request.basket_id,
            title=request.title,
            primary_context_ids=primary_context_ids,
            composition_intent=request.detected_intent,
            max_blocks=request.max_blocks,
            include_supporting_contexts=request.enhance_with_discovery
        )
    
    @classmethod
    async def _get_contexts_by_ids(cls, context_ids: List[UUID], workspace_id: str) -> List[Dict[str, Any]]:
        """Get context items by their IDs."""
        try:
            resp = (
                supabase.table("context_items")
                .select("*")
                .in_("id", [str(cid) for cid in context_ids])
                .eq("status", "active")
                .execute()
            )
            return resp.data or []
        except Exception as e:
            logger.exception(f"Failed to get contexts by IDs: {e}")
            return []
    
    @classmethod
    async def _get_block_details(cls, block_id: UUID, workspace_id: str) -> Dict[str, Any]:
        """Get block details by ID."""
        try:
            resp = (
                supabase.table("blocks")
                .select("*")
                .eq("id", str(block_id))
                .eq("workspace_id", workspace_id)
                .single()
                .execute()
            )
            return resp.data or {}
        except Exception as e:
            logger.warning(f"Failed to get block {block_id}: {e}")
            return {}
    
    @classmethod
    async def _get_block_content(cls, block_id: UUID, workspace_id: str) -> str:
        """Get block content by ID."""
        block_details = await cls._get_block_details(block_id, workspace_id)
        return block_details.get("content", "")
    
    @classmethod
    async def _get_block_semantic_type(cls, block_id: UUID, workspace_id: str) -> str:
        """Get block semantic type by ID."""
        block_details = await cls._get_block_details(block_id, workspace_id)
        return block_details.get("semantic_type", "insight")
    
    @classmethod
    async def _get_block_state(cls, block_id: UUID, workspace_id: str) -> str:
        """Get block state by ID."""
        block_details = await cls._get_block_details(block_id, workspace_id)
        return block_details.get("state", "PROPOSED")
    
    @classmethod
    async def _log_composition_event(
        cls,
        document: Document,
        request: ContextDrivenCompositionRequest,
        workspace_id: str
    ) -> None:
        """Log document composition event for audit trail."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(request.basket_id),
            "kind": "document.context_composed",
            "payload": {
                "document_id": str(document.id),
                "title": document.title,
                "composition_method": "context_driven",
                "composition_request": request.model_dump(),
                "primary_context_count": len(document.composition_intelligence.primary_contexts),
                "discovered_blocks_count": len(document.block_references),
                "coherence_score": document.document_coherence.overall_coherence_score,
                "detected_intent": document.composition_intelligence.detected_intent,
                "target_audience": document.composition_intelligence.target_audience,
                "workspace_id": workspace_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()