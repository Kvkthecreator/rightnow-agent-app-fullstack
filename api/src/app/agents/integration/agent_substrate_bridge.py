"""Bridge between existing agent infrastructure and new substrate operations."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID

from ..services.dump_interpreter import DumpInterpreterService, RawDumpInterpretationRequest
from ..services.context_tagger import ContextTaggerService, ContextTagRequest
from ..services.substrate_ops import AgentMemoryOperations
from ...models.context import ContextItemType

# Import narrative agents for user-facing intelligence
from ..narrative.project_understanding_agent import ProjectUnderstandingAgent
from ..narrative.ai_assistant_agent import AIAssistantAgent
from ..narrative.intelligent_guidance_agent import IntelligentGuidanceAgent

logger = logging.getLogger("uvicorn.error")


class AgentSubstrateBridge:
    """Bridge service connecting existing agents to substrate operations."""
    
    @classmethod
    async def interpret_dump_for_agent(
        cls,
        raw_dump_id: str,
        workspace_id: str,
        agent_id: str,
        interpretation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Helper for existing agents to interpret dumps into block proposals."""
        
        try:
            request = RawDumpInterpretationRequest(
                raw_dump_id=UUID(raw_dump_id),
                interpretation_prompt=interpretation_context.get("prompt") if interpretation_context else None,
                max_blocks=interpretation_context.get("max_blocks", 10) if interpretation_context else 10,
                agent_id=agent_id
            )
            
            result = await DumpInterpreterService.interpret_dump(request, workspace_id)
            
            return {
                "success": True,
                "blocks_proposed": len(result.proposed_blocks),
                "proposed_blocks": result.proposed_blocks,
                "interpretation_summary": result.interpretation_summary,
                "agent_confidence": result.agent_confidence
            }
            
        except Exception as e:
            logger.exception(f"Agent dump interpretation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "blocks_proposed": 0
            }
    
    @classmethod
    async def tag_memory_for_agent(
        cls,
        target_id: str,
        target_type: str,
        context_type: str,
        content: str,
        workspace_id: str,
        agent_id: str,
        confidence: float = 0.8,
        reasoning: Optional[str] = None
    ) -> Dict[str, Any]:
        """Helper for existing agents to create context tags."""
        
        try:
            request = ContextTagRequest(
                target_id=UUID(target_id),
                target_type=target_type,
                context_type=ContextItemType(context_type),
                content=content,
                confidence=confidence,
                agent_id=agent_id,
                meta_notes=reasoning
            )
            
            result = await ContextTaggerService.tag_memory_object(request, workspace_id)
            
            return {
                "success": True,
                "context_item_id": result["id"],
                "context_item": result
            }
            
        except Exception as e:
            logger.exception(f"Agent context tagging failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def quick_block_proposal(
        cls,
        basket_id: str,
        content: str,
        agent_id: str,
        workspace_id: str,
        semantic_type: str = "insight"
    ) -> Dict[str, Any]:
        """Quick block proposal for legacy agent integration."""
        
        try:
            result = await AgentMemoryOperations.quick_propose_block(
                basket_id=UUID(basket_id),
                content=content,
                agent_id=agent_id,
                semantic_type=semantic_type,
                workspace_id=workspace_id
            )
            
            return {
                "success": result.success,
                "block_id": result.result_data.get("block_id") if result.success else None,
                "error": result.error_message
            }
            
        except Exception as e:
            logger.exception(f"Quick block proposal failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def analyze_basket_health(
        cls,
        basket_id: str,
        workspace_id: str,
        agent_id: str
    ) -> Dict[str, Any]:
        """Analyze basket memory health for existing agents."""
        
        try:
            from ..services.substrate_ops import AgentSubstrateService, AgentSubstrateRequest, SubstrateOperationType
            
            request = AgentSubstrateRequest(
                operation_type=SubstrateOperationType.ANALYZE_MEMORY,
                agent_id=agent_id,
                agent_type="infra_health_checker",
                target_id=UUID(basket_id),
                parameters={"basket_id": basket_id}
            )
            
            result = await AgentSubstrateService.execute_operation(request, workspace_id)
            
            if result.success:
                analysis = result.result_data.get("analysis", {})
                return {
                    "success": True,
                    "health_analysis": analysis,
                    "total_blocks": analysis.get("total_blocks", 0),
                    "context_coverage": analysis.get("context_coverage", 0.0),
                    "issues_count": len(analysis.get("consistency_issues", []))
                }
            else:
                return {
                    "success": False,
                    "error": result.error_message
                }
                
        except Exception as e:
            logger.exception(f"Basket health analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def analyze_basket_intelligence(
        cls,
        basket_id: str,
        workspace_id: str,
        agent_id: str,
        analysis_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Analyze basket intelligence for existing agents using new Chapter 3.5 services."""
        
        try:
            from ...baskets.services.pattern_recognition import BasketPatternRecognitionService
            from ...baskets.services.coherence_suggestions import CoherenceSuggestionsService
            from ...baskets.services.relationship_discovery import RelationshipDiscoveryService
            from ...baskets.services.inconsistency_accommodation import InconsistencyAccommodationService
            from ...schemas.basket_intelligence_schema import PatternAnalysisRequest
            
            basket_uuid = UUID(basket_id)
            
            # Perform pattern analysis
            pattern_request = PatternAnalysisRequest(
                basket_id=basket_uuid,
                accommodate_inconsistency=True,
                suggestion_gentleness="gentle"
            )
            
            thematic_analysis = await BasketPatternRecognitionService.analyze_basket_patterns(
                pattern_request, workspace_id
            )
            
            # Get coherence suggestions if comprehensive analysis
            suggestions = None
            if analysis_type == "comprehensive":
                suggestions = await CoherenceSuggestionsService.generate_gentle_suggestions(
                    basket_uuid, workspace_id, thematic_analysis
                )
            
            # Get context health
            context_health = await InconsistencyAccommodationService.assess_context_health(
                basket_uuid, workspace_id, thematic_analysis
            )
            
            return {
                "success": True,
                "thematic_analysis": {
                    "dominant_themes": thematic_analysis.dominant_themes,
                    "coherence_level": thematic_analysis.coherence_level,
                    "content_diversity": thematic_analysis.content_diversity,
                    "patterns_count": len(thematic_analysis.discovered_patterns),
                    "thematic_summary": thematic_analysis.thematic_summary
                },
                "context_health": {
                    "health_score": context_health.overall_health_score,
                    "human_compatibility": context_health.human_compatibility_score,
                    "inconsistencies_count": len(context_health.inconsistencies),
                    "accommodation_strategies": context_health.accommodation_strategies
                },
                "suggestions": {
                    "total_suggestions": suggestions.total_suggestions if suggestions else 0,
                    "priority_level": suggestions.priority_level if suggestions else "none",
                    "accommodation_note": suggestions.accommodation_note if suggestions else "Analysis focused on patterns only"
                }
            }
            
        except Exception as e:
            logger.exception(f"Basket intelligence analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Narrative Intelligence Coordination Methods
    @classmethod
    async def get_project_understanding(
        cls,
        basket_id: str,
        workspace_id: str,
        user_context: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Get project understanding from narrative agent."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(workspace_id)
            understanding = await understanding_agent.create_project_understanding(
                basket_id, user_context
            )
            
            return {
                "success": True,
                "understanding": {
                    "personalized_greeting": understanding.personalized_greeting,
                    "current_understanding": understanding.current_understanding,
                    "intelligence_level": understanding.intelligence_level,
                    "confidence": understanding.confidence,
                    "discovered_themes": understanding.discovered_themes,
                    "next_steps": understanding.next_steps,
                    "recommended_actions": understanding.recommended_actions
                }
            }
            
        except Exception as e:
            logger.exception(f"Project understanding failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def generate_ai_assistance(
        cls,
        basket_id: str,
        workspace_id: str,
        user_query: Optional[str] = None,
        user_context: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Generate conversational AI assistance."""
        
        try:
            ai_assistant = AIAssistantAgent(workspace_id)
            response = await ai_assistant.generate_conversational_response(
                basket_id, user_query, user_context
            )
            
            return {
                "success": True,
                "response": {
                    "message": response.message,
                    "tone": response.tone.value,
                    "suggestions": [
                        {
                            "action": s.action,
                            "description": s.description,
                            "user_benefit": s.user_benefit,
                            "priority": s.priority
                        } for s in response.suggestions
                    ],
                    "follow_up_questions": response.follow_up_questions,
                    "assistant_personality": response.assistant_personality.value,
                    "user_engagement_level": response.user_engagement_level.value,
                    "conversation_flow": response.conversation_flow.value
                }
            }
            
        except Exception as e:
            logger.exception(f"AI assistance generation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def get_intelligent_guidance(
        cls,
        basket_id: str,
        workspace_id: str,
        focus_area: Optional[str] = None,
        user_goal: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get strategic guidance from intelligent guidance agent."""
        
        try:
            guidance_agent = IntelligentGuidanceAgent(workspace_id)
            guidance_list = await guidance_agent.generate_strategic_guidance(
                basket_id, focus_area, user_goal
            )
            
            return {
                "success": True,
                "guidance": [
                    {
                        "title": g.title,
                        "description": g.description,
                        "recommendation": g.recommendation,
                        "reasoning": g.reasoning,
                        "action_plan": [
                            {
                                "step": step.step,
                                "description": step.description,
                                "user_benefit": step.user_benefit,
                                "estimated_time": step.estimated_time,
                                "prerequisite": step.prerequisite
                            } for step in g.action_plan
                        ],
                        "expected_outcome": g.expected_outcome,
                        "timeframe": g.timeframe.value,
                        "difficulty": g.difficulty.value
                    } for g in guidance_list
                ]
            }
            
        except Exception as e:
            logger.exception(f"Intelligent guidance failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def assess_project_health(
        cls,
        basket_id: str,
        workspace_id: str,
        previous_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Assess project health using intelligent guidance agent."""
        
        try:
            guidance_agent = IntelligentGuidanceAgent(workspace_id)
            health_assessment = await guidance_agent.evaluate_project_health(
                basket_id, previous_analysis
            )
            
            return {
                "success": True,
                "health_assessment": {
                    "overall_health": health_assessment.overall_health.value,
                    "strengths": health_assessment.strengths,
                    "improvement_areas": health_assessment.improvement_areas,
                    "recommendations": [
                        {
                            "focus": rec.focus,
                            "suggestion": rec.suggestion,
                            "impact": rec.impact,
                            "effort": rec.effort
                        } for rec in health_assessment.recommendations
                    ],
                    "progress_trajectory": health_assessment.progress_trajectory.value
                }
            }
            
        except Exception as e:
            logger.exception(f"Project health assessment failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @classmethod
    async def get_contextual_next_steps(
        cls,
        basket_id: str,
        workspace_id: str,
        user_goal: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get contextual next steps from intelligent guidance agent."""
        
        try:
            guidance_agent = IntelligentGuidanceAgent(workspace_id)
            next_steps = await guidance_agent.generate_contextual_next_steps(
                basket_id, user_goal
            )
            
            # Transform action steps to dictionary format
            formatted_steps = []
            for step in next_steps.get("immediate_steps", []):
                formatted_steps.append({
                    "step": step.step,
                    "description": step.description,
                    "user_benefit": step.user_benefit,
                    "estimated_time": step.estimated_time,
                    "prerequisite": step.prerequisite
                })
            
            return {
                "success": True,
                "next_steps": {
                    "immediate_steps": formatted_steps,
                    "short_term_goals": next_steps.get("short_term_goals", []),
                    "strategic_considerations": next_steps.get("strategic_considerations", [])
                }
            }
            
        except Exception as e:
            logger.exception(f"Contextual next steps failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Convenience functions for existing agent code
async def agent_interpret_dump(
    raw_dump_id: str,
    workspace_id: str,
    agent_id: str,
    max_blocks: int = 10
) -> Dict[str, Any]:
    """Convenience function for existing agents to interpret dumps."""
    return await AgentSubstrateBridge.interpret_dump_for_agent(
        raw_dump_id=raw_dump_id,
        workspace_id=workspace_id,
        agent_id=agent_id,
        interpretation_context={"max_blocks": max_blocks}
    )


async def agent_tag_context(
    target_id: str,
    target_type: str,
    context_type: str,
    content: str,
    workspace_id: str,
    agent_id: str,
    confidence: float = 0.8
) -> Dict[str, Any]:
    """Convenience function for existing agents to create context tags."""
    return await AgentSubstrateBridge.tag_memory_for_agent(
        target_id=target_id,
        target_type=target_type,
        context_type=context_type,
        content=content,
        workspace_id=workspace_id,
        agent_id=agent_id,
        confidence=confidence
    )


async def agent_propose_block(
    basket_id: str,
    content: str,
    agent_id: str,
    workspace_id: str,
    semantic_type: str = "insight"
) -> Dict[str, Any]:
    """Convenience function for existing agents to propose blocks."""
    return await AgentSubstrateBridge.quick_block_proposal(
        basket_id=basket_id,
        content=content,
        agent_id=agent_id,
        workspace_id=workspace_id,
        semantic_type=semantic_type
    )


async def agent_analyze_basket_intelligence(
    basket_id: str,
    workspace_id: str,
    agent_id: str,
    analysis_type: str = "comprehensive"
) -> Dict[str, Any]:
    """Convenience function for existing agents to analyze basket intelligence."""
    return await AgentSubstrateBridge.analyze_basket_intelligence(
        basket_id=basket_id,
        workspace_id=workspace_id,
        agent_id=agent_id,
        analysis_type=analysis_type
    )


# Narrative Intelligence Convenience Functions
async def agent_get_project_understanding(
    basket_id: str,
    workspace_id: str,
    user_context: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Convenience function to get project understanding."""
    return await AgentSubstrateBridge.get_project_understanding(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_context=user_context
    )


async def agent_generate_ai_assistance(
    basket_id: str,
    workspace_id: str,
    user_query: Optional[str] = None,
    user_context: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Convenience function to generate AI assistance."""
    return await AgentSubstrateBridge.generate_ai_assistance(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_query=user_query,
        user_context=user_context
    )


async def agent_get_intelligent_guidance(
    basket_id: str,
    workspace_id: str,
    focus_area: Optional[str] = None,
    user_goal: Optional[str] = None
) -> Dict[str, Any]:
    """Convenience function to get intelligent guidance."""
    return await AgentSubstrateBridge.get_intelligent_guidance(
        basket_id=basket_id,
        workspace_id=workspace_id,
        focus_area=focus_area,
        user_goal=user_goal
    )


async def agent_assess_project_health(
    basket_id: str,
    workspace_id: str,
    previous_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Convenience function to assess project health."""
    return await AgentSubstrateBridge.assess_project_health(
        basket_id=basket_id,
        workspace_id=workspace_id,
        previous_analysis=previous_analysis
    )


async def agent_get_contextual_next_steps(
    basket_id: str,
    workspace_id: str,
    user_goal: Optional[str] = None
) -> Dict[str, Any]:
    """Convenience function to get contextual next steps."""
    return await AgentSubstrateBridge.get_contextual_next_steps(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_goal=user_goal
    )