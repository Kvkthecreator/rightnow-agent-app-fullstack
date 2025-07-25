"""Bridge between existing agent infrastructure and new substrate operations."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID

from ..services.dump_interpreter import DumpInterpreterService, RawDumpInterpretationRequest
from ..services.context_tagger import ContextTaggerService, ContextTagRequest
from ..services.substrate_ops import AgentMemoryOperations
from ...models.context import ContextItemType

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