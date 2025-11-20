"""
Work Requests API - Phase 6: Basket-First Onboarding

Endpoints for NEW user onboarding with deterministic basket scaffolding.

This is NOT a replacement for existing agent execution flows.
Power users can still use POST /api/agents/run directly with manually-created baskets.

Future: Smart work orchestration with basket inference will be separate.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.utils.jwt import verify_jwt
from app.routes.work_orchestration import _get_workspace_id_for_user
from services.onboarding_scaffolder import (
    scaffold_new_user_onboarding,
    ScaffoldingError,
)
from utils.permissions import PermissionDeniedError

router = APIRouter(prefix="/work-requests", tags=["work-requests"])
logger = logging.getLogger(__name__)


# ========================================================================
# Request/Response Models
# ========================================================================


class NewWorkRequestRequest(BaseModel):
    """Request to create new work request with basket scaffolding (NEW users)."""

    agent_type: str = Field(
        ...,
        description="Agent type (research, content, reporting)",
        pattern="^(research|content|reporting)$",
    )
    initial_context: str = Field(
        ..., description="Initial context/input for basket", min_length=10, max_length=50000
    )
    work_mode: str = Field(
        default="general", description="Work mode (default: general)"
    )
    basket_name: Optional[str] = Field(
        None, description="Optional basket name (auto-generated if not provided)"
    )


class WorkRequestResponse(BaseModel):
    """Response from work request creation."""

    work_request_id: str
    basket_id: str
    basket_name: str
    dump_id: str
    status: str
    is_trial_request: bool
    remaining_trials: Optional[int]
    message: str
    next_step: str


# ========================================================================
# Endpoints
# ========================================================================


@router.post("/new", response_model=WorkRequestResponse)
async def create_new_work_request(
    request: NewWorkRequestRequest, user: dict = Depends(verify_jwt)
):
    """
    Create new work request with basket-first scaffolding (NEW users).

    Phase 6: Deterministic onboarding flow for NEW users.
    Orchestrates:
    1. Permission check (trial/subscription)
    2. Basket creation (substrate-api)
    3. Raw dump creation (substrate-api)
    4. Work request record (work-platform)

    This is a wrapper for onboarding, NOT a replacement for existing flows.
    Power users can still use POST /api/agents/run with manually-created baskets.

    Future: Smart orchestration for existing users will be separate endpoint.

    Args:
        request: Work request parameters
        user: Authenticated user from JWT

    Returns:
        Work request creation result

    Example Request:
        {
            "agent_type": "research",
            "initial_context": "Research latest AI developments in healthcare",
            "basket_name": "Healthcare AI Research",
            "work_mode": "general"
        }

    Example Response:
        {
            "work_request_id": "550e8400-...",
            "basket_id": "660e8400-...",
            "basket_name": "Healthcare AI Research",
            "dump_id": "770e8400-...",
            "status": "scaffolded",
            "is_trial_request": true,
            "remaining_trials": 7,
            "message": "Basket scaffolded successfully. Ready for agent execution.",
            "next_step": "Use POST /api/agents/run with basket_id to execute agent"
        }
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get workspace_id for user (reuse helper from agent_orchestration)
    workspace_id = await _get_workspace_id_for_user(user_id)

    logger.info(
        f"[ONBOARDING API] Creating work request: user={user_id}, "
        f"agent={request.agent_type}, workspace={workspace_id}"
    )

    try:
        result = await scaffold_new_user_onboarding(
            user_id=user_id,
            workspace_id=workspace_id,
            agent_type=request.agent_type,
            initial_context=request.initial_context,
            work_mode=request.work_mode,
            basket_name=request.basket_name,
        )

        logger.info(
            f"[ONBOARDING API] ✅ SUCCESS: work_request={result['work_request_id']}, "
            f"basket={result['basket_id']}"
        )

        return WorkRequestResponse(
            **result,
            message="Basket scaffolded successfully. Ready for agent execution.",
        )

    except PermissionDeniedError as e:
        logger.warning(f"[ONBOARDING API] Permission denied: {e}")
        raise HTTPException(
            status_code=403,
            detail={
                "message": str(e),
                "remaining_trials": e.remaining_trials,
                "agent_type": e.agent_type,
            },
        )

    except ScaffoldingError as e:
        logger.error(
            f"[ONBOARDING API] Scaffolding failed at step '{e.step}': {e.message}"
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": e.message,
                "step": e.step,
                "basket_id": e.basket_id,
                "dump_id": e.dump_id,
                "details": e.details,
            },
        )

    except Exception as e:
        logger.exception(f"[ONBOARDING API] Unexpected error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create work request: {str(e)}"
        )
