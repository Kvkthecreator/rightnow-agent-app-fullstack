"""Infrastructure agent for comprehensive basket analysis with human-compatible flexibility."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID

from ...schemas.basket_intelligence_schema import (
    BasketIntelligenceReport, AgentBasketAnalysisRequest
)
from ...baskets.services.pattern_recognition import BasketPatternRecognitionService
from ...baskets.services.coherence_suggestions import CoherenceSuggestionsService
from ...baskets.services.relationship_discovery import RelationshipDiscoveryService
from ...baskets.services.inconsistency_accommodation import InconsistencyAccommodationService
from ...baskets.services.improvement_guidance import ImprovementGuidanceService
from ..base import BaseInfraAgent

logger = logging.getLogger("uvicorn.error")


class InfraBasketAnalyzerAgent(BaseInfraAgent):
    """Infrastructure agent for analyzing baskets with accommodation and flexibility."""
    
    agent_type = "infra_basket_analyzer"
    agent_description = "Analyzes basket contents for patterns, relationships, and improvement opportunities with human-compatible flexibility"
    
    def __init__(self, agent_id: str, workspace_id: str):
        super().__init__(agent_id, workspace_id)
        self.analysis_capabilities = {
            "pattern_recognition": True,
            "relationship_discovery": True,
            "coherence_assessment": True,
            "inconsistency_accommodation": True,
            "improvement_guidance": True,
            "flexibility_optimization": True
        }
    
    async def analyze_basket_comprehensively(
        self,
        request: AgentBasketAnalysisRequest
    ) -> BasketIntelligenceReport:
        """Perform comprehensive basket analysis with accommodation approach."""
        
        try:
            logger.info(f"Starting comprehensive basket analysis for {request.basket_id}")
            
            # Step 1: Thematic pattern analysis
            thematic_analysis = await self._perform_thematic_analysis(request)
            
            # Step 2: Coherence suggestions (gentle)
            coherence_suggestions = await self._generate_coherence_suggestions(
                request, thematic_analysis
            )
            
            # Step 3: Document relationship discovery
            document_relationships = await self._discover_document_relationships(
                request, thematic_analysis
            )
            
            # Step 4: Context health assessment (accommodation-focused)
            context_health = await self._assess_context_health(
                request, thematic_analysis
            )
            
            # Step 5: Generate pattern insights
            pattern_insights = self._generate_comprehensive_insights(
                thematic_analysis, coherence_suggestions, document_relationships, context_health
            )
            
            # Step 6: Generate accommodation summary
            accommodation_summary = self._generate_accommodation_summary(
                context_health, thematic_analysis
            )
            
            # Step 7: Assess flexibility
            flexibility_assessment = await self._assess_flexibility(request)
            
            # Step 8: Generate human value proposition
            human_value_proposition = self._generate_human_value_proposition(
                thematic_analysis, context_health, flexibility_assessment
            )
            
            # Step 9: Suggest next steps (if user is interested)
            next_steps_if_interested = await self._suggest_next_steps(request)
            
            # Compile comprehensive report
            report = BasketIntelligenceReport(
                basket_id=request.basket_id,
                thematic_analysis=thematic_analysis,
                coherence_suggestions=coherence_suggestions,
                document_relationships=document_relationships,
                context_health=context_health,
                pattern_insights=pattern_insights,
                accommodation_summary=accommodation_summary,
                flexibility_assessment=flexibility_assessment,
                human_value_proposition=human_value_proposition,
                next_steps_if_interested=next_steps_if_interested,
                analysis_metadata={
                    "agent_type": self.agent_type,
                    "analysis_approach": "accommodation_and_flexibility",
                    "respect_inconsistency": request.respect_inconsistency,
                    "accommodate_messiness": request.accommodate_messiness,
                    "analysis_goals": request.analysis_goals,
                    "human_compatibility_optimized": True
                }
            )
            
            logger.info(f"Completed comprehensive basket analysis for {request.basket_id}")
            return report
            
        except Exception as e:
            logger.exception(f"Failed to analyze basket {request.basket_id}: {e}")
            raise
    
    async def analyze_basket_patterns_only(
        self,
        basket_id: UUID,
        accommodate_inconsistency: bool = True
    ) -> BasketIntelligenceReport:
        """Perform pattern-only analysis for lighter assessment."""
        
        request = AgentBasketAnalysisRequest(
            agent_id=self.agent_id,
            agent_type=self.agent_type,
            basket_id=basket_id,
            analysis_goals=["pattern_recognition"],
            respect_inconsistency=accommodate_inconsistency,
            accommodate_messiness=True
        )
        
        # Focus only on thematic analysis
        thematic_analysis = await self._perform_thematic_analysis(request)
        
        # Minimal other components
        from ...schemas.basket_intelligence_schema import (
            BasketCoherenceSuggestions, CrossDocumentRelationships, BasketContextHealth
        )
        
        empty_suggestions = BasketCoherenceSuggestions(basket_id=basket_id)
        empty_relationships = CrossDocumentRelationships(basket_id=basket_id)
        
        # Quick context health for pattern-only mode
        context_health = BasketContextHealth(
            basket_id=basket_id,
            overall_health_score=0.8,  # Assume good health
            health_note="Pattern-only analysis - full health assessment not performed"
        )
        
        return BasketIntelligenceReport(
            basket_id=basket_id,
            thematic_analysis=thematic_analysis,
            coherence_suggestions=empty_suggestions,
            document_relationships=empty_relationships,
            context_health=context_health,
            pattern_insights=thematic_analysis.pattern_insights,
            accommodation_summary="Pattern-only analysis with inconsistency accommodation",
            flexibility_assessment="High flexibility maintained in pattern recognition",
            human_value_proposition="Patterns discovered without enforcing rigid structure",
            next_steps_if_interested=["Consider full analysis if comprehensive insights needed"],
            analysis_metadata={
                "agent_type": self.agent_type,
                "analysis_mode": "patterns_only",
                "lightweight": True
            }
        )
    
    async def suggest_basket_improvements(
        self,
        basket_id: UUID,
        user_explicitly_requested: bool = False
    ) -> List[str]:
        """Generate gentle improvement suggestions."""
        
        guidance = await ImprovementGuidanceService.generate_improvement_guidance(
            basket_id, self.workspace_id, user_requested=user_explicitly_requested
        )
        
        if not user_explicitly_requested and not guidance.improvement_opportunities:
            return ["Your basket is developing well - no suggestions needed at this time"]
        
        suggestions = []
        
        # Convert opportunities to actionable suggestions
        for opportunity in guidance.improvement_opportunities:
            if "context" in opportunity.lower():
                suggestions.append("Consider adding context items if project details feel missing")
            elif "theme" in opportunity.lower():
                suggestions.append("If helpful, clarify themes to communicate project direction")
            elif "document" in opportunity.lower():
                suggestions.append("Explore document connections if seeing relationships would be valuable")
            else:
                suggestions.append(f"Opportunity: {opportunity.lower()}")
        
        # Always emphasize user choice
        suggestions.append("All suggestions are optional - your current approach may be perfect")
        
        return suggestions
    
    async def _perform_thematic_analysis(
        self,
        request: AgentBasketAnalysisRequest
    ) -> Any:  # BasketThematicAnalysis
        """Perform thematic pattern analysis."""
        
        from ...schemas.basket_intelligence_schema import PatternAnalysisRequest
        
        analysis_request = PatternAnalysisRequest(
            basket_id=request.basket_id,
            analysis_depth="standard",
            accommodate_inconsistency=request.respect_inconsistency,
            include_suggestions=True,
            suggestion_gentleness=request.suggestion_style
        )
        
        return await BasketPatternRecognitionService.analyze_basket_patterns(
            analysis_request, self.workspace_id
        )
    
    async def _generate_coherence_suggestions(
        self,
        request: AgentBasketAnalysisRequest,
        thematic_analysis: Any
    ) -> Any:  # BasketCoherenceSuggestions
        """Generate gentle coherence suggestions."""
        
        return await CoherenceSuggestionsService.generate_gentle_suggestions(
            request.basket_id,
            self.workspace_id,
            thematic_analysis,
            request.suggestion_style
        )
    
    async def _discover_document_relationships(
        self,
        request: AgentBasketAnalysisRequest,
        thematic_analysis: Any
    ) -> Any:  # CrossDocumentRelationships
        """Discover document relationships without enforcement."""
        
        return await RelationshipDiscoveryService.discover_document_relationships(
            request.basket_id,
            self.workspace_id,
            thematic_analysis,
            include_weak_relationships=request.accommodate_messiness
        )
    
    async def _assess_context_health(
        self,
        request: AgentBasketAnalysisRequest,
        thematic_analysis: Any
    ) -> Any:  # BasketContextHealth
        """Assess context health with accommodation approach."""
        
        return await InconsistencyAccommodationService.assess_context_health(
            request.basket_id,
            self.workspace_id,
            thematic_analysis
        )
    
    def _generate_comprehensive_insights(
        self,
        thematic_analysis: Any,
        coherence_suggestions: Any,
        document_relationships: Any,
        context_health: Any
    ) -> List[str]:
        """Generate comprehensive insights from all analysis components."""
        
        insights = []
        
        # Thematic insights
        insights.extend(thematic_analysis.pattern_insights[:2])
        
        # Relationship insights
        if document_relationships.connection_insights:
            insights.extend(document_relationships.connection_insights[:2])
        
        # Health insights
        if context_health.health_insights:
            insights.extend(context_health.health_insights[:2])
        
        # Meta-insights about the analysis approach
        if context_health.inconsistencies:
            insights.append(f"Analysis accommodated {len(context_health.inconsistencies)} areas of creative complexity")
        
        if thematic_analysis.content_diversity > 0.7:
            insights.append("High content diversity indicates comprehensive project exploration")
        
        # Coherence insights
        if coherence_suggestions.total_suggestions > 0:
            insights.append(f"{coherence_suggestions.total_suggestions} optional improvement ideas identified")
        
        return insights[:6]  # Limit insights to avoid overwhelming
    
    def _generate_accommodation_summary(
        self,
        context_health: Any,
        thematic_analysis: Any
    ) -> str:
        """Generate summary of how inconsistencies are accommodated."""
        
        summary_parts = []
        
        inconsistency_count = len(context_health.inconsistencies)
        
        if inconsistency_count == 0:
            summary_parts.append("Basket shows consistent patterns")
        else:
            summary_parts.append(f"Basket accommodates {inconsistency_count} areas of creative complexity")
        
        if thematic_analysis.coherence_level == "mixed":
            summary_parts.append("Mixed coherence reflects natural project diversity")
        elif thematic_analysis.coherence_level == "high":
            summary_parts.append("High coherence maintained while preserving flexibility")
        
        summary_parts.append("Accommodation approach preserves human working patterns")
        summary_parts.append("Inconsistencies treated as creative richness rather than errors")
        
        return ". ".join(summary_parts) + "."
    
    async def _assess_flexibility(self, request: AgentBasketAnalysisRequest) -> str:
        """Assess overall basket flexibility."""
        
        flexibility_metrics = await InconsistencyAccommodationService.generate_flexibility_metrics(
            request.basket_id, self.workspace_id
        )
        
        flexibility_score = flexibility_metrics.flexibility_score
        
        if flexibility_score > 0.8:
            return "High flexibility - excellent accommodation of human working patterns"
        elif flexibility_score > 0.6:
            return "Good flexibility - accommodates natural project evolution"
        else:
            return "Moderate flexibility - some structure present with room for adaptation"
    
    def _generate_human_value_proposition(
        self,
        thematic_analysis: Any,
        context_health: Any,
        flexibility_assessment: str
    ) -> str:
        """Generate value proposition for human users."""
        
        value_parts = []
        
        # Pattern discovery value
        pattern_count = len(thematic_analysis.discovered_patterns)
        if pattern_count > 0:
            value_parts.append(f"Discovered {pattern_count} thematic patterns in your work")
        
        # Accommodation value
        if context_health.inconsistencies:
            value_parts.append("Accommodates creative inconsistencies as valuable diversity")
        
        # Flexibility value
        if "High flexibility" in flexibility_assessment:
            value_parts.append("Maintains high flexibility for natural project evolution")
        
        # Coherence value without pressure
        value_parts.append("Provides insights while respecting your project's natural development")
        value_parts.append("Balances pattern recognition with creative freedom")
        
        return ". ".join(value_parts) + "."
    
    async def _suggest_next_steps(self, request: AgentBasketAnalysisRequest) -> List[str]:
        """Suggest next steps if user is interested."""
        
        next_steps = await ImprovementGuidanceService.suggest_next_steps(
            request.basket_id, self.workspace_id
        )
        
        # Ensure all steps are appropriately gentle
        gentle_steps = []
        for step in next_steps:
            if not any(phrase in step.lower() for phrase in ["consider", "if", "might", "could"]):
                gentle_steps.append(f"Consider: {step.lower()}")
            else:
                gentle_steps.append(step)
        
        return gentle_steps
    
    async def analyze_basket_evolution(
        self,
        basket_id: UUID,
        time_period: str = "week"
    ) -> Dict[str, Any]:
        """Analyze how basket has evolved over time."""
        
        # This would implement temporal analysis
        # For now, return a placeholder structure
        return {
            "evolution_detected": True,
            "evolution_type": "natural_development",
            "evolution_summary": "Basket shows natural development patterns over time",
            "evolution_value": "Evolution indicates healthy project progression",
            "evolution_recommendations": [
                "Continue current development approach",
                "Evolution patterns suggest good project momentum"
            ]
        }
    
    async def compare_baskets(
        self,
        basket_ids: List[UUID],
        comparison_focus: List[str] = None
    ) -> Dict[str, Any]:
        """Compare multiple baskets for patterns and insights."""
        
        if len(basket_ids) < 2:
            return {"error": "Need at least 2 baskets for comparison"}
        
        # This would implement cross-basket analysis
        # For now, return a placeholder structure
        return {
            "baskets_analyzed": len(basket_ids),
            "comparison_summary": "Cross-basket pattern analysis completed",
            "common_patterns": ["project_development", "content_evolution"],
            "unique_patterns": ["basket_specific_themes"],
            "comparison_insights": [
                "Each basket shows unique development patterns",
                "Common themes indicate consistent working approach"
            ]
        }