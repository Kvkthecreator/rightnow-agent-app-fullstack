"""Agent-callable document composition service."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4

from ...schemas.document_composition_schema import (
    AgentCompositionRequest, ContextDrivenDocument, CompositionSuggestion,
    CompositionOpportunityAnalysis
)
from ...agents.services.substrate_ops import (
    AgentSubstrateRequest, SubstrateOperationType, AgentSubstrateService
)
from ...agents.runtime.tasks_document_composer_agent import (
    TasksDocumentComposerAgent, DocumentComposerAgentFactory
)
from ...documents.services.document_architect import DocumentArchitectService
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json

logger = logging.getLogger("uvicorn.error")


class AgentDocumentCompositionService:
    """Service for agent-driven document composition operations."""
    
    @classmethod
    async def compose_document_for_agent(
        cls,
        request: AgentCompositionRequest,
        workspace_id: str
    ) -> ContextDrivenDocument:
        """Create a document using agent-driven composition."""
        
        # Validate agent permissions
        if not request.agent_type.startswith("tasks_"):
            raise ValueError("Only tasks agents can compose documents")
        
        # Create or get specialized composer agent
        composer_agent = cls._get_composer_agent(request.agent_id, request.agent_type)
        
        # Execute agent composition
        document = await composer_agent.compose_contextual_document(
            request, workspace_id
        )
        
        # Log composition operation
        await cls._log_agent_composition(request, document, workspace_id)
        
        return document
    
    @classmethod
    async def suggest_compositions_for_agent(
        cls,
        agent_id: str,
        agent_type: str,
        basket_id: UUID,
        workspace_id: str
    ) -> List[CompositionSuggestion]:
        """Get composition suggestions optimized for agent capabilities."""
        
        # Validate agent permissions
        if not agent_type.startswith("tasks_"):
            raise ValueError("Only tasks agents can request composition suggestions")
        
        # Create composer agent
        composer_agent = cls._get_composer_agent(agent_id, agent_type)
        
        # Get agent-enhanced suggestions
        suggestions = await composer_agent.suggest_composition_opportunities(
            basket_id, workspace_id
        )
        
        # Log suggestion request
        await cls._log_suggestion_request(agent_id, agent_type, basket_id, len(suggestions), workspace_id)
        
        return suggestions
    
    @classmethod
    async def analyze_composition_opportunities_for_agent(
        cls,
        agent_id: str,
        agent_type: str,
        basket_id: UUID,
        workspace_id: str
    ) -> CompositionOpportunityAnalysis:
        """Analyze composition opportunities with agent intelligence."""
        
        # Validate agent permissions
        if not agent_type.startswith("tasks_"):
            raise ValueError("Only tasks agents can analyze composition opportunities")
        
        # Get base analysis
        base_analysis = await DocumentArchitectService.analyze_composition_opportunities(
            basket_id, workspace_id
        )
        
        # Enhance with agent intelligence
        enhanced_analysis = await cls._enhance_analysis_with_agent_intelligence(
            base_analysis, agent_id, agent_type, workspace_id
        )
        
        return enhanced_analysis
    
    @classmethod
    async def execute_agent_composition_operation(
        cls,
        operation_request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Execute document composition operations through agent substrate."""
        
        if operation_request.operation_type == "COMPOSE_DOCUMENT":
            return await cls._handle_agent_document_composition(operation_request, workspace_id)
        elif operation_request.operation_type == "SUGGEST_COMPOSITIONS":
            return await cls._handle_agent_composition_suggestions(operation_request, workspace_id)
        elif operation_request.operation_type == "ANALYZE_OPPORTUNITIES":
            return await cls._handle_agent_opportunity_analysis(operation_request, workspace_id)
        else:
            raise ValueError(f"Unsupported composition operation: {operation_request.operation_type}")
    
    @classmethod
    def _get_composer_agent(cls, agent_id: str, agent_type: str) -> TasksDocumentComposerAgent:
        """Get or create a composer agent."""
        
        # Determine specialization from agent type
        if "strategic" in agent_type:
            return DocumentComposerAgentFactory.create_specialized_composer("strategic", agent_id)
        elif "technical" in agent_type:
            return DocumentComposerAgentFactory.create_specialized_composer("technical", agent_id)
        elif "creative" in agent_type:
            return DocumentComposerAgentFactory.create_specialized_composer("creative", agent_id)
        else:
            return DocumentComposerAgentFactory.create_composer_agent(agent_id)
    
    @classmethod
    async def _enhance_analysis_with_agent_intelligence(
        cls,
        base_analysis: CompositionOpportunityAnalysis,
        agent_id: str,
        agent_type: str,
        workspace_id: str
    ) -> CompositionOpportunityAnalysis:
        """Enhance opportunity analysis with agent intelligence."""
        
        # Create agent for analysis enhancement
        composer_agent = cls._get_composer_agent(agent_id, agent_type)
        
        # Agent evaluates each suggestion
        enhanced_suggestions = []
        for suggestion in base_analysis.suggested_compositions:
            agent_confidence = await composer_agent._evaluate_suggestion_feasibility(
                suggestion, base_analysis.basket_id, workspace_id
            )
            
            enhanced_suggestion = CompositionSuggestion(
                **suggestion.model_dump(),
                confidence=agent_confidence,
                composition_rationale=f"{suggestion.composition_rationale} (Agent-evaluated)"
            )
            enhanced_suggestions.append(enhanced_suggestion)
        
        # Agent-specific recommendations
        agent_recommendations = await cls._generate_agent_recommendations(
            base_analysis, agent_type
        )
        
        # Enhanced analysis
        return CompositionOpportunityAnalysis(
            **base_analysis.model_dump(),
            suggested_compositions=enhanced_suggestions[:5],  # Top 5 agent-evaluated
            recommended_next_steps=base_analysis.recommended_next_steps + agent_recommendations,
            analysis_metadata={
                **base_analysis.analysis_metadata,
                "agent_enhanced": True,
                "enhancing_agent_id": agent_id,
                "enhancing_agent_type": agent_type,
                "enhancement_timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @classmethod
    async def _generate_agent_recommendations(
        cls,
        analysis: CompositionOpportunityAnalysis,
        agent_type: str
    ) -> List[str]:
        """Generate agent-specific recommendations."""
        
        recommendations = []
        
        # Agent type-specific recommendations
        if "strategic" in agent_type:
            if analysis.composition_readiness_score > 0.7:
                recommendations.append("Agent recommends creating strategic analysis document for leadership")
            recommendations.append("Consider focusing on business impact and competitive advantage themes")
        
        elif "technical" in agent_type:
            if any("technical_guide" in s.composition_type for s in analysis.suggested_compositions):
                recommendations.append("Agent identified strong technical guide opportunity")
            recommendations.append("Prioritize implementation details and technical constraints")
        
        elif "creative" in agent_type:
            if any("creative_brief" in s.composition_type for s in analysis.suggested_compositions):
                recommendations.append("Agent suggests creative brief with visual storytelling elements")
            recommendations.append("Focus on brand narrative and aesthetic considerations")
        
        # General agent recommendations
        high_value_count = analysis.high_value_opportunities
        if high_value_count > 1:
            recommendations.append(f"Agent suggests starting with highest-confidence opportunity among {high_value_count} options")
        
        return recommendations
    
    @classmethod
    async def _handle_agent_document_composition(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle agent document composition operation."""
        
        params = request.parameters
        required_fields = ["basket_id", "composition_goal"]
        
        for field in required_fields:
            if field not in params:
                raise ValueError(f"Missing required parameter: {field}")
        
        # Build agent composition request
        composition_request = AgentCompositionRequest(
            agent_id=request.agent_id,
            agent_type=request.agent_type,
            basket_id=UUID(params["basket_id"]),
            composition_goal=params["composition_goal"],
            composition_constraints=params.get("composition_constraints", []),
            max_blocks=params.get("max_blocks", 20),
            preferred_style=params.get("preferred_style"),
            target_audience=params.get("target_audience"),
            custom_instructions=request.reasoning
        )
        
        # Execute composition
        document = await cls.compose_document_for_agent(composition_request, workspace_id)
        
        return {
            "document": document.model_dump(),
            "audit_events": [f"Document composed by agent {request.agent_type}"],
            "document_id": str(document.id),
            "coherence_score": document.context_coherence_score
        }
    
    @classmethod
    async def _handle_agent_composition_suggestions(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle agent composition suggestions operation."""
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for composition suggestions")
        
        # Get suggestions
        suggestions = await cls.suggest_compositions_for_agent(
            request.agent_id, request.agent_type, basket_id, workspace_id
        )
        
        return {
            "suggestions": [s.model_dump() for s in suggestions],
            "audit_events": [f"Composition suggestions generated by agent {request.agent_type}"],
            "suggestion_count": len(suggestions),
            "highest_confidence": max([s.confidence for s in suggestions]) if suggestions else 0.0
        }
    
    @classmethod
    async def _handle_agent_opportunity_analysis(
        cls,
        request: AgentSubstrateRequest,
        workspace_id: str
    ) -> Dict[str, Any]:
        """Handle agent opportunity analysis operation."""
        
        params = request.parameters
        basket_id = UUID(params.get("basket_id")) if params.get("basket_id") else request.target_id
        
        if not basket_id:
            raise ValueError("basket_id required for opportunity analysis")
        
        # Get analysis
        analysis = await cls.analyze_composition_opportunities_for_agent(
            request.agent_id, request.agent_type, basket_id, workspace_id
        )
        
        return {
            "opportunity_analysis": analysis.model_dump(),
            "audit_events": [f"Opportunity analysis performed by agent {request.agent_type}"],
            "total_opportunities": analysis.total_opportunities,
            "readiness_score": analysis.composition_readiness_score
        }
    
    @classmethod
    async def _log_agent_composition(
        cls,
        request: AgentCompositionRequest,
        document: ContextDrivenDocument,
        workspace_id: str
    ) -> None:
        """Log agent composition activity."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(request.basket_id),
            "kind": "agent.document_composition",
            "payload": {
                "agent_id": request.agent_id,
                "agent_type": request.agent_type,
                "document_id": str(document.id),
                "composition_goal": request.composition_goal,
                "composition_constraints": request.composition_constraints,
                "document_title": document.title,
                "coherence_score": document.context_coherence_score,
                "blocks_used": len(document.discovered_blocks),
                "sections_created": len(document.document_sections),
                "target_audience": request.target_audience,
                "preferred_style": request.preferred_style,
                "workspace_id": workspace_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()
    
    @classmethod
    async def _log_suggestion_request(
        cls,
        agent_id: str,
        agent_type: str,
        basket_id: UUID,
        suggestion_count: int,
        workspace_id: str
    ) -> None:
        """Log agent suggestion request."""
        
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(basket_id),
            "kind": "agent.composition_suggestions",
            "payload": {
                "agent_id": agent_id,
                "agent_type": agent_type,
                "suggestion_count": suggestion_count,
                "workspace_id": workspace_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()


# Convenience functions for agent operations
class AgentCompositionOperations:
    """High-level convenience functions for agent composition operations."""
    
    @classmethod
    async def quick_compose_document(
        cls,
        agent_id: str,
        basket_id: UUID,
        composition_goal: str,
        workspace_id: str,
        target_audience: str = None,
        max_blocks: int = 15
    ) -> Dict[str, Any]:
        """Quick document composition for agents."""
        
        request = AgentCompositionRequest(
            agent_id=agent_id,
            agent_type=f"tasks_{agent_id}",
            basket_id=basket_id,
            composition_goal=composition_goal,
            target_audience=target_audience,
            max_blocks=max_blocks
        )
        
        return await AgentDocumentCompositionService.compose_document_for_agent(
            request, workspace_id
        )
    
    @classmethod
    async def quick_get_suggestions(
        cls,
        agent_id: str,
        basket_id: UUID,
        workspace_id: str
    ) -> List[CompositionSuggestion]:
        """Quick composition suggestions for agents."""
        
        return await AgentDocumentCompositionService.suggest_compositions_for_agent(
            agent_id, f"tasks_{agent_id}", basket_id, workspace_id
        )
    
    @classmethod
    async def quick_analyze_opportunities(
        cls,
        agent_id: str,
        basket_id: UUID,
        workspace_id: str
    ) -> CompositionOpportunityAnalysis:
        """Quick opportunity analysis for agents."""
        
        return await AgentDocumentCompositionService.analyze_composition_opportunities_for_agent(
            agent_id, f"tasks_{agent_id}", basket_id, workspace_id
        )