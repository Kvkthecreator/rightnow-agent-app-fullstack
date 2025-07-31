"""Context-aware document composition agent for tasks category."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4

from ....schemas.document_composition_schema import (
    AgentCompositionRequest, ContextDrivenDocument, CompositionSuggestion
)
from ...documents.services.context_composition import ContextCompositionService
from ...documents.services.document_architect import DocumentArchitectService
from ...context.services.composition_intelligence import CompositionIntelligenceService
from ...context.services.context_hierarchy import ContextHierarchyService
from ...agents.services.substrate_ops import AgentMemoryOperations
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json

logger = logging.getLogger("uvicorn.error")


class TasksDocumentComposerAgent:
    """Intelligent document composition agent that understands context DNA."""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.agent_type = f"tasks_{agent_id}"
        self.capabilities = [
            "context_analysis",
            "composition_planning", 
            "document_creation",
            "audience_adaptation",
            "narrative_intelligence"
        ]
    
    async def compose_contextual_document(
        self,
        request: AgentCompositionRequest,
        workspace_id: str
    ) -> ContextDrivenDocument:
        """Create a document using context-driven composition intelligence."""
        
        try:
            # Step 1: Analyze composition opportunities
            logger.info(f"Agent {self.agent_id} analyzing composition opportunities for basket {request.basket_id}")
            
            opportunities = await self._analyze_composition_opportunities(
                request.basket_id, workspace_id
            )
            
            # Step 2: Select optimal composition approach
            composition_plan = await self._plan_composition(
                request, opportunities, workspace_id
            )
            
            # Step 3: Execute composition using planned approach
            document = await self._execute_composition(
                composition_plan, workspace_id
            )
            
            # Step 4: Validate and enhance document
            enhanced_document = await self._validate_and_enhance_document(
                document, composition_plan, workspace_id
            )
            
            # Step 5: Log agent composition activity
            await self._log_composition_activity(
                request, composition_plan, enhanced_document, workspace_id
            )
            
            return enhanced_document
            
        except Exception as e:
            logger.exception(f"Agent composition failed: {e}")
            await self._log_composition_failure(request, str(e), workspace_id)
            raise
    
    async def suggest_composition_opportunities(
        self,
        basket_id: UUID,
        workspace_id: str
    ) -> List[CompositionSuggestion]:
        """Analyze and suggest document composition opportunities."""
        
        try:
            # Get composition opportunity analysis
            analysis = await DocumentArchitectService.analyze_composition_opportunities(
                basket_id, workspace_id
            )
            
            # Agent-enhanced suggestions with confidence scoring
            enhanced_suggestions = []
            
            for suggestion in analysis.suggested_compositions:
                # Agent evaluates each suggestion
                enhanced_confidence = await self._evaluate_suggestion_feasibility(
                    suggestion, basket_id, workspace_id
                )
                
                # Enhance suggestion with agent insights
                enhanced_suggestion = CompositionSuggestion(
                    **suggestion.model_dump(),
                    confidence=enhanced_confidence,
                    composition_rationale=f"{suggestion.composition_rationale} (Agent confidence: {enhanced_confidence:.1%})"
                )
                
                enhanced_suggestions.append(enhanced_suggestion)
            
            # Sort by agent-enhanced confidence
            enhanced_suggestions.sort(key=lambda x: x.confidence, reverse=True)
            
            return enhanced_suggestions[:5]  # Return top 5
            
        except Exception as e:
            logger.exception(f"Failed to suggest composition opportunities: {e}")
            return []
    
    async def _analyze_composition_opportunities(
        self,
        basket_id: UUID,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Analyze composition opportunities with agent intelligence."""
        
        # Get comprehensive analysis
        composition_intelligence = await AgentMemoryOperations.quick_analyze_composition_intelligence(
            basket_id=basket_id,
            agent_id=self.agent_id,
            workspace_id=workspace_id
        )
        
        # Get readiness assessment
        readiness_assessment = await AgentMemoryOperations.quick_assess_composition_readiness(
            basket_id=basket_id,
            agent_id=self.agent_id,
            workspace_id=workspace_id
        )
        
        # Get architecture analysis
        architecture_analysis = await DocumentArchitectService.analyze_composition_opportunities(
            basket_id, workspace_id
        )
        
        return {
            "composition_intelligence": composition_intelligence,
            "readiness_assessment": readiness_assessment,
            "architecture_analysis": architecture_analysis,
            "agent_insights": await self._generate_agent_insights(
                composition_intelligence, readiness_assessment, architecture_analysis
            )
        }
    
    async def _plan_composition(
        self,
        request: AgentCompositionRequest,
        opportunities: Dict[str, Any],
        workspace_id: str
    ) -> Dict[str, Any]:
        """Plan the composition approach based on analysis."""
        
        readiness = opportunities["readiness_assessment"]["result_data"]["readiness_assessment"]
        architecture = opportunities["architecture_analysis"]
        
        # Determine composition strategy
        if readiness["readiness_score"] < 0.4:
            strategy = "foundation_building"
            approach = "simple_summary"
        elif readiness["readiness_score"] < 0.7:
            strategy = "incremental_composition"
            approach = "structured_analysis"
        else:
            strategy = "advanced_composition"
            approach = "contextual_intelligence"
        
        # Select optimal composition type
        if architecture.suggested_compositions:
            composition_type = architecture.suggested_compositions[0].composition_type
            suggested_structure = DocumentArchitectService.suggest_document_structure(
                composition_type,
                [],  # Will be filled during execution
                request.target_audience
            )
        else:
            composition_type = "executive_summary"
            suggested_structure = DocumentArchitectService.suggest_document_structure(
                composition_type, [], request.target_audience
            )
        
        # Build composition plan
        plan = {
            "strategy": strategy,
            "approach": approach,
            "composition_type": composition_type,
            "target_audience": request.target_audience or self._infer_audience(opportunities),
            "preferred_style": request.preferred_style or self._infer_style(opportunities),
            "max_blocks": request.max_blocks,
            "suggested_structure": suggested_structure,
            "agent_rationale": f"Agent selected {strategy} strategy based on {readiness['readiness_score']:.1%} readiness",
            "custom_instructions": request.custom_instructions,
            "auto_title": request.auto_title_generation
        }
        
        return plan
    
    async def _execute_composition(
        self,
        plan: Dict[str, Any],
        workspace_id: str
    ) -> ContextDrivenDocument:
        """Execute the planned composition."""
        
        from ....schemas.document_composition_schema import ContextDrivenCompositionRequest
        
        # Build composition request from plan
        composition_request = ContextDrivenCompositionRequest(
            basket_id=UUID(plan.get("basket_id")),  # This should be passed in plan
            title=None if plan["auto_title"] else "Agent Composed Document",
            composition_intent=plan["composition_type"],
            target_audience=plan["target_audience"],
            style_preference=plan["preferred_style"],
            max_blocks=plan["max_blocks"],
            custom_instructions=plan["custom_instructions"]
        )
        
        # Execute composition
        document = await ContextCompositionService.compose_contextual_document(
            composition_request,
            workspace_id,
            created_by=None  # Agent-created
        )
        
        # Mark as agent-composed
        document.created_by_agent = self.agent_id
        
        return document
    
    async def _validate_and_enhance_document(
        self,
        document: ContextDrivenDocument,
        plan: Dict[str, Any],
        workspace_id: str
    ) -> ContextDrivenDocument:
        """Validate and enhance the composed document."""
        
        # Agent validation checks
        validation_results = {
            "coherence_check": document.context_coherence_score > 0.6,
            "structure_check": len(document.document_sections) >= 2,
            "content_check": len(document.content_raw) > 500,
            "context_alignment": len(document.discovered_blocks) > 0
        }
        
        # Enhancement opportunities
        enhancements = []
        
        if document.context_coherence_score < 0.7:
            enhancements.append("Consider adding more contextual connections")
        
        if len(document.discovered_blocks) < 5:
            enhancements.append("Could benefit from additional relevant blocks")
        
        # Update document with agent enhancements
        enhanced_metadata = document.composition_metadata.copy()
        enhanced_metadata.update({
            "agent_validation": validation_results,
            "agent_enhancements": enhancements,
            "agent_composition_plan": plan,
            "agent_id": self.agent_id
        })
        
        # Create enhanced document
        enhanced_document = ContextDrivenDocument(
            **document.model_dump(),
            composition_metadata=enhanced_metadata
        )
        
        return enhanced_document
    
    async def _evaluate_suggestion_feasibility(
        self,
        suggestion: CompositionSuggestion,
        basket_id: UUID,
        workspace_id: str
    ) -> float:
        """Agent evaluates feasibility of a composition suggestion."""
        
        factors = []
        
        # Base confidence from suggestion
        factors.append(suggestion.confidence)
        
        # Check if we have required contexts
        if suggestion.primary_contexts:
            context_availability = len(suggestion.primary_contexts) / max(2, len(suggestion.primary_contexts))
            factors.append(context_availability)
        
        # Complexity assessment
        complexity_scores = {"simple": 0.9, "medium": 0.7, "complex": 0.5}
        complexity_factor = complexity_scores.get(suggestion.creation_complexity, 0.6)
        factors.append(complexity_factor)
        
        # Expected value weighting
        value_scores = {"high": 0.9, "medium": 0.7, "low": 0.5}
        value_factor = value_scores.get(suggestion.expected_value, 0.6)
        factors.append(value_factor)
        
        # Agent confidence adjustment
        agent_confidence = sum(factors) / len(factors) if factors else 0.5
        
        # Apply agent experience factor (agents get better over time)
        experience_factor = min(1.0, 0.8 + 0.01)  # Simplified experience model
        
        return min(agent_confidence * experience_factor, 1.0)
    
    async def _generate_agent_insights(
        self,
        composition_intelligence,
        readiness_assessment,
        architecture_analysis
    ) -> List[str]:
        """Generate agent-specific insights about composition opportunities."""
        
        insights = []
        
        readiness_score = readiness_assessment["result_data"]["readiness_assessment"]["readiness_score"]
        
        if readiness_score > 0.8:
            insights.append("Excellent composition readiness - agent recommends advanced document creation")
        elif readiness_score > 0.6:
            insights.append("Good composition foundation - agent suggests structured approach")
        else:
            insights.append("Building blocks need strengthening - agent recommends foundational work first")
        
        # Architecture insights
        if architecture_analysis.high_value_opportunities > 0:
            insights.append(f"Agent identified {architecture_analysis.high_value_opportunities} high-value composition opportunities")
        
        # Context insights
        composition_report = composition_intelligence["result_data"]["composition_report"]
        if composition_report["intent_analysis"]["intent_confidence"] > 0.7:
            insights.append("Clear composition intent detected - agent confident in direction")
        
        return insights
    
    def _infer_audience(self, opportunities: Dict[str, Any]) -> Optional[str]:
        """Infer target audience from composition analysis."""
        
        composition_intel = opportunities["composition_intelligence"]["result_data"]["composition_report"]
        audience_indicators = composition_intel["intent_analysis"]["audience_indicators"]
        
        return audience_indicators[0] if audience_indicators else None
    
    def _infer_style(self, opportunities: Dict[str, Any]) -> Optional[str]:
        """Infer composition style from analysis."""
        
        composition_intel = opportunities["composition_intelligence"]["result_data"]["composition_report"]
        style_indicators = composition_intel["intent_analysis"]["style_indicators"]
        
        return style_indicators[0] if style_indicators else None
    
    async def _log_composition_activity(
        self,
        request: AgentCompositionRequest,
        plan: Dict[str, Any],
        document: ContextDrivenDocument,
        workspace_id: str
    ) -> None:
        """Log agent composition activity."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(request.basket_id),
            "kind": "agent.document_composed",
            "payload": {
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "document_id": str(document.id),
                "composition_goal": request.composition_goal,
                "composition_strategy": plan["strategy"],
                "composition_type": plan["composition_type"],
                "document_coherence": document.context_coherence_score,
                "blocks_used": len(document.discovered_blocks),
                "sections_created": len(document.document_sections),
                "target_audience": plan["target_audience"],
                "composition_style": plan["preferred_style"],
                "agent_rationale": plan["agent_rationale"],
                "workspace_id": workspace_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()
    
    async def _log_composition_failure(
        self,
        request: AgentCompositionRequest,
        error_message: str,
        workspace_id: str
    ) -> None:
        """Log agent composition failure."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(request.basket_id),
            "kind": "agent.composition_failed",
            "payload": {
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "composition_goal": request.composition_goal,
                "error_message": error_message,
                "workspace_id": workspace_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()


class DocumentComposerAgentFactory:
    """Factory for creating document composer agents."""
    
    @classmethod
    def create_composer_agent(cls, agent_id: str = None) -> TasksDocumentComposerAgent:
        """Create a new document composer agent."""
        
        if not agent_id:
            agent_id = f"composer_{uuid4().hex[:8]}"
        
        return TasksDocumentComposerAgent(agent_id)
    
    @classmethod
    def create_specialized_composer(
        cls,
        specialization: str,
        agent_id: str = None
    ) -> TasksDocumentComposerAgent:
        """Create a specialized composer agent."""
        
        if not agent_id:
            agent_id = f"{specialization}_composer_{uuid4().hex[:8]}"
        
        agent = TasksDocumentComposerAgent(agent_id)
        
        # Add specialization-specific capabilities
        if specialization == "strategic":
            agent.capabilities.extend([
                "strategic_analysis",
                "executive_communication",
                "business_intelligence"
            ])
        elif specialization == "technical":
            agent.capabilities.extend([
                "technical_documentation",
                "implementation_guidance", 
                "code_analysis"
            ])
        elif specialization == "creative":
            agent.capabilities.extend([
                "creative_direction",
                "brand_communication",
                "visual_storytelling"
            ])
        
        return agent