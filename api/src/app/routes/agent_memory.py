"""API routes for agent-substrate memory operations."""

import logging
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..agents.services.dump_interpreter import (
    DumpInterpreterService,
    SmartDumpInterpreter,
    RawDumpInterpretationRequest
)
from ..agents.services.context_tagger import (
    ContextTaggerService,
    ContextTagRequest
)
from ..agents.services.substrate_ops import (
    AgentSubstrateService,
    AgentSubstrateRequest,
    SubstrateOperationType
)
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace

router = APIRouter(prefix="/agents", tags=["agent-memory"])
logger = logging.getLogger("uvicorn.error")


# Request/Response Models
class InterpretDumpRequest(BaseModel):
    interpretation_prompt: Optional[str] = None
    max_blocks: int = Field(default=10, ge=1, le=50)
    use_smart_interpreter: bool = Field(default=False)


class TagContextRequest(BaseModel):
    target_id: UUID
    target_type: str = Field(..., pattern="^(block|document|basket)$")
    context_type: str
    content: str = Field(..., min_length=3)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    meta_notes: Optional[str] = None


class MemoryAnalysisRequest(BaseModel):
    basket_id: UUID
    include_suggestions: bool = Field(default=True)
    focus_types: Optional[List[str]] = None


@router.post("/interpret-dump/{raw_dump_id}")
async def interpret_raw_dump(
    raw_dump_id: str,
    request: InterpretDumpRequest,
    user: dict = Depends(verify_jwt)
):
    """Interpret a raw dump into structured block proposals."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        interpretation_request = RawDumpInterpretationRequest(
            raw_dump_id=UUID(raw_dump_id),
            interpretation_prompt=request.interpretation_prompt,
            max_blocks=request.max_blocks,
            agent_id=f"user_initiated_{user['user_id']}"  # Agent ID for user-initiated requests
        )
        
        if request.use_smart_interpreter:
            result = await SmartDumpInterpreter.interpret_with_context(
                interpretation_request, workspace_id
            )
        else:
            result = await DumpInterpreterService.interpret_dump(
                interpretation_request, workspace_id
            )
        
        return result.model_dump()
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Raw dump interpretation failed")
        raise HTTPException(500, "Internal error")


@router.post("/tag-context")
async def tag_memory_context(
    request: TagContextRequest,
    user: dict = Depends(verify_jwt)
):
    """Create context item tags for memory objects."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        # Import here to avoid circular imports
        from ..models.context import ContextItemType
        
        tag_request = ContextTagRequest(
            target_id=request.target_id,
            target_type=request.target_type,
            context_type=ContextItemType(request.context_type),
            content=request.content,
            confidence=request.confidence,
            agent_id=f"user_initiated_{user['user_id']}",
            meta_notes=request.meta_notes
        )
        
        result = await ContextTaggerService.tag_memory_object(tag_request, workspace_id)
        return result
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Context tagging failed")
        raise HTTPException(500, "Internal error")


@router.post("/memory-analysis/{basket_id}")
async def analyze_basket_memory(
    basket_id: str,
    request: MemoryAnalysisRequest,
    user: dict = Depends(verify_jwt)
):
    """Perform comprehensive memory analysis on a basket."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        # Import here to avoid circular imports
        from ..models.context import ContextItemType
        
        focus_types = None
        if request.focus_types:
            focus_types = [ContextItemType(t) for t in request.focus_types]
        
        if request.include_suggestions:
            result = await ContextTaggerService.analyze_memory_semantics(
                basket_id=UUID(basket_id),
                workspace_id=workspace_id,
                agent_id=f"analysis_{user['user_id']}",
                focus_types=focus_types
            )
            return result.model_dump()
        else:
            # Just return analysis without creating suggestions
            substrate_request = AgentSubstrateRequest(
                operation_type=SubstrateOperationType.ANALYZE_MEMORY,
                agent_id=f"analysis_{user['user_id']}",
                agent_type="infra_analyzer",
                target_id=UUID(basket_id),
                parameters={"basket_id": basket_id}
            )
            
            result = await AgentSubstrateService.execute_operation(substrate_request, workspace_id)
            return result.result_data.get("analysis", {})
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Memory analysis failed")
        raise HTTPException(500, "Internal error")


@router.post("/substrate-operation")
async def execute_substrate_operation(
    request: AgentSubstrateRequest,
    user: dict = Depends(verify_jwt)
):
    """Execute a generic substrate operation (for advanced agent use)."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        # Validate user has permission to execute agent operations
        # This could be restricted to admin users or specific roles
        
        result = await AgentSubstrateService.execute_operation(request, workspace_id)
        return result.model_dump()
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Substrate operation failed")
        raise HTTPException(500, "Internal error")


@router.get("/memory-health/{basket_id}")
async def get_memory_health(
    basket_id: str,
    user: dict = Depends(verify_jwt),
    include_recommendations: bool = Query(default=True)
):
    """Get memory health status for a basket."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        substrate_request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ANALYZE_MEMORY,
            agent_id=f"health_check_{user['user_id']}",
            agent_type="infra_health_checker",
            target_id=UUID(basket_id),
            parameters={
                "basket_id": basket_id,
                "health_check": True
            }
        )
        
        result = await AgentSubstrateService.execute_operation(substrate_request, workspace_id)
        
        if not result.success:
            raise HTTPException(500, result.error_message or "Health check failed")
        
        analysis = result.result_data.get("analysis", {})
        
        # Calculate health score
        total_blocks = analysis.get("total_blocks", 0)
        context_coverage = analysis.get("context_coverage", 0.0)
        consistency_issues = len(analysis.get("consistency_issues", []))
        
        health_score = 1.0
        if consistency_issues > 0:
            health_score -= min(0.3, consistency_issues * 0.1)
        if context_coverage < 0.5:
            health_score -= (0.5 - context_coverage) * 0.4
        
        health_status = "excellent" if health_score >= 0.9 else \
                       "good" if health_score >= 0.7 else \
                       "fair" if health_score >= 0.5 else "poor"
        
        response = {
            "basket_id": basket_id,
            "health_score": round(health_score, 2),
            "health_status": health_status,
            "total_blocks": total_blocks,
            "context_coverage": round(context_coverage, 2),
            "consistency_issues_count": consistency_issues,
            **analysis
        }
        
        if not include_recommendations:
            response.pop("recommendations", None)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Memory health check failed")
        raise HTTPException(500, "Internal error")


@router.get("/context-suggestions/{basket_id}")
async def get_context_suggestions(
    basket_id: str,
    user: dict = Depends(verify_jwt),
    context_type: Optional[str] = Query(None),
    min_confidence: float = Query(default=0.7, ge=0.0, le=1.0)
):
    """Get context tagging suggestions for a basket."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        # Import here to avoid circular imports
        from ..models.context import ContextItemType
        
        focus_types = None
        if context_type:
            focus_types = [ContextItemType(context_type)]
        
        # Get suggestions without auto-creating them
        result = await ContextTaggerService.analyze_memory_semantics(
            basket_id=UUID(basket_id),
            workspace_id=workspace_id,
            agent_id=f"suggestions_{user['user_id']}",
            focus_types=focus_types
        )
        
        # Filter by confidence threshold
        high_confidence_suggestions = []
        for item in result.context_items_created:
            if item.get("confidence", 0.0) >= min_confidence:
                high_confidence_suggestions.append(item)
        
        return {
            "basket_id": basket_id,
            "suggestions": high_confidence_suggestions,
            "total_suggestions": len(result.context_items_created),
            "high_confidence_count": len(high_confidence_suggestions),
            "min_confidence_threshold": min_confidence,
            "relationships": [r._asdict() for r in result.relationships_identified]
        }
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Context suggestions failed")
        raise HTTPException(500, "Internal error")


@router.get("/operation-history/{basket_id}")
async def get_agent_operation_history(
    basket_id: str,
    user: dict = Depends(verify_jwt),
    limit: int = Query(default=50, ge=1, le=200),
    operation_type: Optional[str] = Query(None)
):
    """Get history of agent operations on a basket."""
    try:
        workspace_id = get_or_create_workspace(user["user_id"])
        
        from ..utils.supabase_client import supabase_client as supabase
        
        query = (
            supabase.table("events")
            .select("*")
            .eq("basket_id", basket_id)
            .like("kind", "agent.%")
            .order("ts", desc=True)
            .limit(limit)
        )
        
        if operation_type:
            query = query.contains("payload", {"operation_type": operation_type})
        
        resp = query.execute()
        
        return {
            "basket_id": basket_id,
            "operations": resp.data or [],
            "total_count": len(resp.data or [])
        }
        
    except Exception as e:
        logger.exception("Failed to get operation history")
        raise HTTPException(500, "Internal error")