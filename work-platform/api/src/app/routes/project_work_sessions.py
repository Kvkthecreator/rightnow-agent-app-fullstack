"""
Project Work Sessions API - Phase 6.5

Project-scoped work sessions that integrate with:
- project_agents (many-to-many)
- agent_work_requests (billing/trials)
- work_sessions (execution records)

This is the NEW endpoint for project-based work requests.
Old /api/work/sessions endpoints remain for backward compatibility.
"""

from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Path
from pydantic import BaseModel, Field

from app.utils.jwt import verify_jwt
from app.utils.supabase_client import supabase_admin_client
from utils.permissions import (
    check_agent_work_request_allowed,
    record_work_request,
    PermissionDeniedError,
)

router = APIRouter(prefix="/projects", tags=["project-work-sessions"])
logger = logging.getLogger(__name__)


# ========================================================================
# Request/Response Models
# ========================================================================


class CreateWorkSessionRequest(BaseModel):
    """Request to create work session for a project agent."""

    agent_id: str = Field(
        ...,
        description="Project agent ID (from project_agents table)"
    )
    task_description: str = Field(
        ...,
        description="Description of work to be performed",
        min_length=10,
        max_length=5000
    )
    work_mode: str = Field(
        default="general",
        description="Work mode (general, governance_proposal, etc.)"
    )
    context: Optional[dict] = Field(
        default={},
        description="Additional context for agent execution"
    )
    priority: int = Field(
        default=5,
        description="Priority level (1-10, higher = more urgent)",
        ge=1,
        le=10
    )


class WorkSessionResponse(BaseModel):
    """Work session response."""

    session_id: str
    project_id: str
    agent_id: str
    agent_type: str
    task_description: str
    status: str
    work_request_id: str
    created_at: str
    is_trial_request: bool
    remaining_trials: Optional[int]
    message: str


# ========================================================================
# Endpoints
# ========================================================================


@router.post("/{project_id}/work-sessions", response_model=WorkSessionResponse)
async def create_project_work_session(
    project_id: str = Path(..., description="Project ID"),
    request: CreateWorkSessionRequest = ...,
    user: dict = Depends(verify_jwt)
):
    """
    Create work session for project agent.

    Phase 6.5: Integrates with project_agents, agent_work_requests, and permissions.

    Flow:
    1. Validate project and agent exist
    2. Get agent_type from project_agents
    3. Check permissions (trial/subscription)
    4. Create agent_work_request (billing)
    5. Create work_session (execution record)
    6. Return session details

    Args:
        project_id: Project ID
        request: Work session creation request
        user: Authenticated user from JWT

    Returns:
        Work session details with trial status

    Raises:
        PermissionDeniedError: If trial exhausted and not subscribed
        HTTPException: If project/agent not found or validation fails
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(
        f"[PROJECT WORK SESSION] Creating work session: "
        f"project={project_id}, agent={request.agent_id}, user={user_id}"
    )

    supabase = supabase_admin_client

    try:
        # ================================================================
        # Step 1: Validate Project Exists and User Has Access
        # ================================================================
        project_response = supabase.table("projects").select(
            "id, name, workspace_id, user_id, basket_id"
        ).eq("id", project_id).single().execute()

        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = project_response.data

        # Verify user owns project (or has workspace access)
        if project["user_id"] != user_id:
            # TODO: Check workspace membership if different user
            raise HTTPException(status_code=403, detail="Access denied")

        workspace_id = project["workspace_id"]
        basket_id = project["basket_id"]

        # ================================================================
        # Step 2: Validate Agent Belongs to Project
        # ================================================================
        agent_response = supabase.table("project_agents").select(
            "id, agent_type, display_name, is_active"
        ).eq("id", request.agent_id).eq("project_id", project_id).single().execute()

        if not agent_response.data:
            raise HTTPException(
                status_code=404,
                detail="Agent not found or does not belong to this project"
            )

        agent = agent_response.data

        if not agent["is_active"]:
            raise HTTPException(status_code=400, detail="Agent is not active")

        agent_type = agent["agent_type"]

        logger.debug(
            f"[PROJECT WORK SESSION] Validated project and agent: "
            f"agent_type={agent_type}, basket={basket_id}"
        )

        # ================================================================
        # Step 3: Check Permissions (Trial/Subscription)
        # ================================================================
        try:
            permission_info = await check_agent_work_request_allowed(
                user_id=user_id,
                workspace_id=workspace_id,
                agent_type=agent_type,
            )
            logger.debug(
                f"[PROJECT WORK SESSION] Permission check passed: "
                f"subscribed={permission_info.get('is_subscribed')}, "
                f"remaining_trials={permission_info.get('remaining_trial_requests')}"
            )
        except PermissionDeniedError as e:
            logger.warning(f"[PROJECT WORK SESSION] Permission denied: {e}")
            raise HTTPException(
                status_code=403,
                detail={
                    "message": str(e),
                    "remaining_trials": e.remaining_trials,
                    "agent_type": e.agent_type,
                },
            )

        # ================================================================
        # Step 4: Create Agent Work Request (Billing/Trial Tracking)
        # ================================================================
        request_payload = {
            "project_id": project_id,
            "agent_id": request.agent_id,
            "task_description": request.task_description[:200],  # Truncate
            "work_mode": request.work_mode,
            "context": request.context,
        }

        try:
            work_request_id = await record_work_request(
                user_id=user_id,
                workspace_id=workspace_id,
                basket_id=basket_id,
                agent_type=agent_type,
                work_mode=request.work_mode,
                request_payload=request_payload,
                permission_info=permission_info,
            )
            logger.info(
                f"[PROJECT WORK SESSION] Created work_request {work_request_id} "
                f"(trial={not permission_info.get('is_subscribed')})"
            )
        except Exception as e:
            logger.error(f"[PROJECT WORK SESSION] Failed to create work_request: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create work request: {str(e)}"
            )

        # ================================================================
        # Step 5: Create Work Session (Execution Record)
        # ================================================================
        session_data = {
            "project_id": project_id,
            "project_agent_id": request.agent_id,
            "agent_work_request_id": work_request_id,
            "basket_id": basket_id,
            "workspace_id": workspace_id,
            "user_id": user_id,
            "task_description": request.task_description,
            "task_type": request.work_mode,
            "status": "pending",
            "context": request.context,
            "priority": request.priority,
        }

        try:
            session_response = supabase.table("work_sessions").insert(
                session_data
            ).execute()

            if not session_response.data:
                raise Exception("No work session created")

            session = session_response.data[0]
            session_id = session["id"]

            logger.info(
                f"[PROJECT WORK SESSION] ✅ SUCCESS: session={session_id}, "
                f"work_request={work_request_id}, agent={agent_type}"
            )

        except Exception as e:
            logger.error(f"[PROJECT WORK SESSION] Failed to create session: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create work session: {str(e)}"
            )

        # ================================================================
        # Step 6: Return Work Session Details
        # ================================================================
        return WorkSessionResponse(
            session_id=session_id,
            project_id=project_id,
            agent_id=request.agent_id,
            agent_type=agent_type,
            task_description=request.task_description,
            status="pending",
            work_request_id=work_request_id,
            created_at=session["created_at"],
            is_trial_request=not permission_info.get("is_subscribed", False),
            remaining_trials=permission_info.get("remaining_trial_requests"),
            message=f"Work session created. Agent will begin processing shortly.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[PROJECT WORK SESSION] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create work session: {str(e)}"
        )
