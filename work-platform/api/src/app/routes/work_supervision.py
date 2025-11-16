"""
Work Supervision API - Minimal human oversight for agent work outputs.

Phase 4: Supervision endpoints that connect agent execution to user review.

Architecture:
- GET /supervision/sessions/{session_id}/outputs - List outputs for review
- POST /supervision/outputs/{output_id}/approve - Approve output
- POST /supervision/outputs/{output_id}/reject - Reject output
- GET /supervision/sessions/{session_id}/summary - Session outcome summary

Key insight: These endpoints are separate from substrate governance.
Work Supervision = human oversight of agent deliverables
Substrate Governance = block lifecycle management
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.utils.jwt import verify_jwt
from app.utils.supabase_client import supabase_admin_client as supabase

router = APIRouter(prefix="/api/supervision", tags=["work-supervision"])
logger = logging.getLogger(__name__)


# ========================================================================
# Request/Response Models
# ========================================================================


class WorkOutputItem(BaseModel):
    """Work output item for review."""
    id: str
    output_type: str
    content: str
    agent_confidence: Optional[float]
    agent_reasoning: Optional[str]
    status: str  # pending, approved, rejected
    created_at: str
    reviewed_at: Optional[str] = None
    reviewed_by_user_id: Optional[str] = None


class SessionOutputsResponse(BaseModel):
    """List of outputs for a session."""
    session_id: str
    session_status: str
    outputs: List[WorkOutputItem]
    total_count: int
    pending_count: int
    approved_count: int
    rejected_count: int


class ApproveOutputRequest(BaseModel):
    """Request to approve an output."""
    feedback: Optional[str] = Field(None, description="Optional reviewer feedback")


class RejectOutputRequest(BaseModel):
    """Request to reject an output."""
    reason: str = Field(..., description="Reason for rejection")


class OutputReviewResponse(BaseModel):
    """Response after reviewing an output."""
    output_id: str
    status: str
    reviewed_at: str
    reviewed_by_user_id: str
    message: str


class SessionSummaryResponse(BaseModel):
    """Summary of session outcomes."""
    session_id: str
    session_status: str
    task_intent: str
    total_outputs: int
    approved_outputs: int
    rejected_outputs: int
    pending_outputs: int
    can_finalize: bool
    created_at: str
    ended_at: Optional[str] = None


# ========================================================================
# Endpoints
# ========================================================================


@router.get("/sessions/{session_id}/outputs", response_model=SessionOutputsResponse)
async def list_session_outputs(
    session_id: str,
    status_filter: Optional[str] = None,
    user: dict = Depends(verify_jwt)
):
    """
    List all outputs for a work session.

    Returns outputs that need human review (supervision).

    Args:
        session_id: Work session UUID
        status_filter: Optional filter (pending, approved, rejected)
        user: Authenticated user

    Returns:
        List of work outputs with review status
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Listing outputs for session {session_id}")

    try:
        # Verify session exists and user has access
        session_resp = supabase.table("work_sessions").select(
            "id, status, workspace_id, task_intent"
        ).eq("id", session_id).single().execute()

        if not session_resp.data:
            raise HTTPException(status_code=404, detail="Work session not found")

        session = session_resp.data

        # Verify user has access to this workspace
        membership = supabase.table("workspace_memberships").select(
            "id"
        ).eq("user_id", user_id).eq(
            "workspace_id", session["workspace_id"]
        ).execute()

        if not membership.data:
            raise HTTPException(status_code=403, detail="Access denied")

        # Fetch outputs
        query = supabase.table("work_outputs").select(
            "id, output_type, content, agent_confidence, agent_reasoning, "
            "status, created_at, reviewed_at, reviewed_by_user_id"
        ).eq("work_session_id", session_id).order("created_at")

        if status_filter:
            query = query.eq("status", status_filter)

        outputs_resp = query.execute()
        outputs = outputs_resp.data or []

        # Count by status
        status_counts = {"pending": 0, "approved": 0, "rejected": 0}
        for output in outputs:
            status_counts[output.get("status", "pending")] = status_counts.get(output.get("status", "pending"), 0) + 1

        output_items = [
            WorkOutputItem(
                id=o["id"],
                output_type=o["output_type"],
                content=o["content"] if isinstance(o["content"], str) else str(o["content"]),
                agent_confidence=o.get("agent_confidence"),
                agent_reasoning=o.get("agent_reasoning"),
                status=o["status"],
                created_at=o["created_at"],
                reviewed_at=o.get("reviewed_at"),
                reviewed_by_user_id=o.get("reviewed_by_user_id")
            )
            for o in outputs
        ]

        return SessionOutputsResponse(
            session_id=session_id,
            session_status=session["status"],
            outputs=output_items,
            total_count=len(outputs),
            pending_count=status_counts["pending"],
            approved_count=status_counts["approved"],
            rejected_count=status_counts["rejected"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[SUPERVISION] Failed to list outputs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outputs/{output_id}/approve", response_model=OutputReviewResponse)
async def approve_output(
    output_id: str,
    request: ApproveOutputRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Approve a work output.

    This marks the output as approved by human reviewer.
    Does NOT automatically trigger substrate governance (that's separate).

    Args:
        output_id: Work output UUID
        request: Approval request with optional feedback
        user: Authenticated user

    Returns:
        Updated output status
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Approving output {output_id} by user {user_id}")

    try:
        # Verify output exists and user has access
        output_resp = supabase.table("work_outputs").select(
            "id, work_session_id"
        ).eq("id", output_id).single().execute()

        if not output_resp.data:
            raise HTTPException(status_code=404, detail="Work output not found")

        session_id = output_resp.data["work_session_id"]

        # Verify user has workspace access
        session_resp = supabase.table("work_sessions").select(
            "workspace_id"
        ).eq("id", session_id).single().execute()

        if not session_resp.data:
            raise HTTPException(status_code=404, detail="Work session not found")

        membership = supabase.table("workspace_memberships").select(
            "id"
        ).eq("user_id", user_id).eq(
            "workspace_id", session_resp.data["workspace_id"]
        ).execute()

        if not membership.data:
            raise HTTPException(status_code=403, detail="Access denied")

        # Update output status
        now = datetime.utcnow().isoformat()
        update_data = {
            "status": "approved",
            "reviewed_at": now,
            "reviewed_by_user_id": user_id
        }

        if request.feedback:
            update_data["review_feedback"] = request.feedback

        supabase.table("work_outputs").update(update_data).eq("id", output_id).execute()

        logger.info(f"[SUPERVISION] ✅ Output {output_id} approved")

        return OutputReviewResponse(
            output_id=output_id,
            status="approved",
            reviewed_at=now,
            reviewed_by_user_id=user_id,
            message="Output approved successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[SUPERVISION] Failed to approve output: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outputs/{output_id}/reject", response_model=OutputReviewResponse)
async def reject_output(
    output_id: str,
    request: RejectOutputRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Reject a work output.

    This marks the output as rejected by human reviewer.

    Args:
        output_id: Work output UUID
        request: Rejection request with reason
        user: Authenticated user

    Returns:
        Updated output status
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Rejecting output {output_id}: {request.reason}")

    try:
        # Same access checks as approve
        output_resp = supabase.table("work_outputs").select(
            "id, work_session_id"
        ).eq("id", output_id).single().execute()

        if not output_resp.data:
            raise HTTPException(status_code=404, detail="Work output not found")

        session_id = output_resp.data["work_session_id"]
        session_resp = supabase.table("work_sessions").select(
            "workspace_id"
        ).eq("id", session_id).single().execute()

        if not session_resp.data:
            raise HTTPException(status_code=404, detail="Work session not found")

        membership = supabase.table("workspace_memberships").select(
            "id"
        ).eq("user_id", user_id).eq(
            "workspace_id", session_resp.data["workspace_id"]
        ).execute()

        if not membership.data:
            raise HTTPException(status_code=403, detail="Access denied")

        # Update output status
        now = datetime.utcnow().isoformat()
        update_data = {
            "status": "rejected",
            "reviewed_at": now,
            "reviewed_by_user_id": user_id,
            "review_feedback": f"REJECTED: {request.reason}"
        }

        supabase.table("work_outputs").update(update_data).eq("id", output_id).execute()

        logger.info(f"[SUPERVISION] ❌ Output {output_id} rejected")

        return OutputReviewResponse(
            output_id=output_id,
            status="rejected",
            reviewed_at=now,
            reviewed_by_user_id=user_id,
            message=f"Output rejected: {request.reason}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[SUPERVISION] Failed to reject output: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/summary", response_model=SessionSummaryResponse)
async def get_session_summary(
    session_id: str,
    user: dict = Depends(verify_jwt)
):
    """
    Get supervision summary for a session.

    Shows outcome of human review process.

    Args:
        session_id: Work session UUID
        user: Authenticated user

    Returns:
        Summary of session with review outcomes
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    try:
        # Fetch session
        session_resp = supabase.table("work_sessions").select(
            "id, status, task_intent, workspace_id, created_at, ended_at"
        ).eq("id", session_id).single().execute()

        if not session_resp.data:
            raise HTTPException(status_code=404, detail="Work session not found")

        session = session_resp.data

        # Verify access
        membership = supabase.table("workspace_memberships").select(
            "id"
        ).eq("user_id", user_id).eq(
            "workspace_id", session["workspace_id"]
        ).execute()

        if not membership.data:
            raise HTTPException(status_code=403, detail="Access denied")

        # Count outputs by status
        outputs_resp = supabase.table("work_outputs").select(
            "status"
        ).eq("work_session_id", session_id).execute()

        outputs = outputs_resp.data or []
        counts = {"pending": 0, "approved": 0, "rejected": 0}
        for o in outputs:
            counts[o["status"]] = counts.get(o["status"], 0) + 1

        # Can finalize if no pending outputs
        can_finalize = counts["pending"] == 0 and len(outputs) > 0

        return SessionSummaryResponse(
            session_id=session_id,
            session_status=session["status"],
            task_intent=session["task_intent"],
            total_outputs=len(outputs),
            approved_outputs=counts["approved"],
            rejected_outputs=counts["rejected"],
            pending_outputs=counts["pending"],
            can_finalize=can_finalize,
            created_at=session["created_at"],
            ended_at=session.get("ended_at")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[SUPERVISION] Failed to get summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/finalize")
async def finalize_session(
    session_id: str,
    user: dict = Depends(verify_jwt)
):
    """
    Finalize session after all outputs reviewed.

    Marks session as completed/failed based on outcomes.

    Args:
        session_id: Work session UUID
        user: Authenticated user

    Returns:
        Final session status
    """
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    logger.info(f"[SUPERVISION] Finalizing session {session_id}")

    try:
        # Get summary first
        summary = await get_session_summary(session_id, user)

        if not summary.can_finalize:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot finalize: {summary.pending_outputs} outputs still pending review"
            )

        # Determine final status
        if summary.approved_outputs > 0 and summary.rejected_outputs == 0:
            final_status = "approved"
        elif summary.rejected_outputs > 0 and summary.approved_outputs == 0:
            final_status = "rejected"
        else:
            final_status = "completed"  # Mixed outcomes

        # Update session
        now = datetime.utcnow().isoformat()
        supabase.table("work_sessions").update({
            "status": final_status,
            "ended_at": now,
            "metadata": {
                "finalized_by": user_id,
                "finalized_at": now,
                "approved_outputs": summary.approved_outputs,
                "rejected_outputs": summary.rejected_outputs
            }
        }).eq("id", session_id).execute()

        logger.info(f"[SUPERVISION] ✅ Session {session_id} finalized as {final_status}")

        return {
            "session_id": session_id,
            "final_status": final_status,
            "finalized_at": now,
            "approved_outputs": summary.approved_outputs,
            "rejected_outputs": summary.rejected_outputs,
            "message": f"Session finalized with status: {final_status}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[SUPERVISION] Failed to finalize session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
