"""
Projects API - Phase 6 Refactor: Project-First Onboarding

Endpoints for NEW user onboarding with project-based organization.

DOMAIN SEPARATION:
- Projects = User-facing containers (work-platform domain)
- Baskets = Storage infrastructure (substrate domain)

This is NOT a replacement for existing agent execution flows.
Power users can still use POST /api/agents/run directly.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.utils.jwt import verify_jwt
from app.routes.agent_orchestration import _get_workspace_id_for_user
from services.project_scaffolder import (
    scaffold_new_project,
    ProjectScaffoldingError,
)
from utils.permissions import PermissionDeniedError

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)


# ========================================================================
# Request/Response Models
# ========================================================================


class CreateProjectRequest(BaseModel):
    """Request to create new project (NEW user onboarding)."""

    project_name: str = Field(
        ...,
        description="Project name",
        min_length=1,
        max_length=200,
    )
    project_type: str = Field(
        default="general",
        description="Project type (research, content_creation, reporting, analysis, general) - defaults to 'general' as projects are just containers",
        pattern="^(research|content_creation|reporting|analysis|general)$",
    )
    initial_context: str = Field(
        default="",
        description="Initial context/notes to seed project (optional if files are provided)",
        max_length=50000,
    )
    description: Optional[str] = Field(
        None,
        description="Optional project description",
        max_length=1000,
    )


class ProjectResponse(BaseModel):
    """Response from project creation."""

    project_id: str
    project_name: str
    basket_id: str
    dump_id: str
    work_request_id: str
    status: str
    is_trial_request: bool
    remaining_trials: Optional[int]
    message: str
    next_step: str


# ========================================================================
# Endpoints
# ========================================================================


@router.post("/new", response_model=ProjectResponse)
async def create_project(
    request: CreateProjectRequest, user: dict = Depends(verify_jwt)
):
    """
    Create new project with complete infrastructure scaffolding (NEW users).

    Phase 6 Refactor: Creates PROJECT (user-facing) with underlying BASKET (storage).

    Orchestrates:
    1. Permission check (trial/subscription)
    2. Basket creation (substrate-api)
    3. Raw dump creation (substrate-api)
    4. Project creation (work-platform DB)
    5. Work request record (for trial tracking)

    This is a wrapper for onboarding, NOT a replacement for existing flows.
    Power users can still use POST /api/agents/run directly.

    Args:
        request: Project creation parameters
        user: Authenticated user from JWT

    Returns:
        Project creation result

    Example Request:
        {
            "project_name": "Healthcare AI Research",
            "project_type": "research",
            "initial_context": "Research latest AI developments in healthcare...",
            "description": "Comprehensive analysis of AI in healthcare"
        }

    Example Response:
        {
            "project_id": "550e8400-...",
            "project_name": "Healthcare AI Research",
            "basket_id": "660e8400-...",
            "dump_id": "770e8400-...",
            "work_request_id": "880e8400-...",
            "status": "active",
            "is_trial_request": true,
            "remaining_trials": 9,
            "message": "Project created successfully. Ready to begin work.",
            "next_step": "Navigate to /projects/550e8400-... to begin work"
        }
    """
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get workspace_id for user (reuse helper from agent_orchestration)
    workspace_id = await _get_workspace_id_for_user(user_id)

    logger.info(
        f"[PROJECTS API] Creating project: user={user_id}, "
        f"type={request.project_type}, workspace={workspace_id}"
    )

    try:
        result = await scaffold_new_project(
            user_id=user_id,
            workspace_id=workspace_id,
            project_name=request.project_name,
            project_type=request.project_type,
            initial_context=request.initial_context,
            description=request.description,
        )

        logger.info(
            f"[PROJECTS API] ✅ SUCCESS: project={result['project_id']}, "
            f"basket={result['basket_id']}"
        )

        return ProjectResponse(
            **result,
            message="Project created successfully. Ready to begin work.",
        )

    except PermissionDeniedError as e:
        logger.warning(f"[PROJECTS API] Permission denied: {e}")
        raise HTTPException(
            status_code=403,
            detail={
                "message": str(e),
                "remaining_trials": e.remaining_trials,
                "agent_type": e.agent_type,
            },
        )

    except ProjectScaffoldingError as e:
        logger.error(
            f"[PROJECTS API] Scaffolding failed at step '{e.step}': {e.message}"
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": e.message,
                "step": e.step,
                "project_id": e.project_id,
                "basket_id": e.basket_id,
                "dump_id": e.dump_id,
                "details": e.details,
            },
        )

    except Exception as e:
        logger.exception(f"[PROJECTS API] Unexpected error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create project: {str(e)}"
        )
