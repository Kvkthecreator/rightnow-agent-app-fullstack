"""Artifact and checkpoint review routes (Phase 1).

Endpoints for reviewing work outputs and resolving checkpoints.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..deps import get_db
from ..utils.jwt import verify_jwt
from ..utils.workspace import get_or_create_workspace
from .models import WorkTicketStatus

router = APIRouter(prefix="/work", tags=["work-platform-reviews"])


# ============================================================================
# Request Models
# ============================================================================


class ArtifactReviewRequest(BaseModel):
    """Request to review an artifact (Phase 1 simplified)."""

    status: str = Field(..., pattern="^(approved|rejected)$")
    review_feedback: Optional[str] = None


class CheckpointResolveRequest(BaseModel):
    """Request to resolve a checkpoint (Phase 1 simplified)."""

    user_decision: str = Field(..., pattern="^(continue|reject|modify)$")
    user_feedback: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================


def _get_workspace_id(user: dict) -> str:
    """Extract or create workspace_id for user."""
    user_id = user.get("sub") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
    return get_or_create_workspace(user_id)


# ============================================================================
# Artifact Review Endpoints
# ============================================================================


@router.get("/tickets/{ticket_id}/outputs")
async def list_session_outputs(
    ticket_id: UUID,
    status_filter: Optional[str] = None,
    user: dict = Depends(verify_jwt),
    db=Depends(get_db),
):
    """List outputs for a work session.

    Args:
        ticket_id: Work session UUID
        status_filter: Filter by artifact status (pending, approved, rejected)
        user: Authenticated user from JWT
        db: Database connection

    Returns:
        List of work outputs
    """
    workspace_id = _get_workspace_id(user)

    # Verify session exists and user has access
    session_query = """
        SELECT id FROM work_tickets
        WHERE id = :ticket_id AND workspace_id = :workspace_id
    """
    session = await db.fetch_one(
        session_query,
        {"ticket_id": str(ticket_id), "workspace_id": workspace_id}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Work session not found")

    # Fetch outputs
    where_clauses = ["work_ticket_id = :ticket_id"]
    values = {"ticket_id": str(ticket_id)}

    if status_filter:
        where_clauses.append("status = :status")
        values["status"] = status_filter

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT * FROM work_outputs
        WHERE {where_sql}
        ORDER BY created_at ASC
    """

    results = await db.fetch_all(query, values)
    return [dict(row) for row in results]


@router.post("/outputs/{artifact_id}/review")
async def review_artifact(
    artifact_id: UUID,
    request: ArtifactReviewRequest,
    user: dict = Depends(verify_jwt),
    db=Depends(get_db),
):
    """Review an artifact (approve or reject).

    Phase 1: Just marks artifact as approved/rejected.
    Phase 2+: Will trigger substrate governance flow.

    Args:
        artifact_id: Artifact UUID
        request: Review decision and feedback
        user: Authenticated user from JWT
        db: Database connection

    Returns:
        Updated artifact
    """
    workspace_id = _get_workspace_id(user)
    user_id = user.get("sub") or user.get("user_id")

    # Verify artifact exists and user has access
    check_query = """
        SELECT wa.id, ws.workspace_id
        FROM work_outputs wa
        JOIN work_tickets ws ON ws.id = wa.work_ticket_id
        WHERE wa.id = :artifact_id
    """
    artifact = await db.fetch_one(check_query, {"artifact_id": str(artifact_id)})

    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")

    if artifact["workspace_id"] != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update artifact
    query = """
        UPDATE work_outputs
        SET
            status = :status,
            reviewed_by_user_id = :reviewed_by_user_id,
            reviewed_at = NOW(),
            review_feedback = :review_feedback
        WHERE id = :artifact_id
        RETURNING *
    """

    values = {
        "artifact_id": str(artifact_id),
        "status": request.status,
        "reviewed_by_user_id": user_id,
        "review_feedback": request.review_feedback,
    }

    result = await db.fetch_one(query, values)
    return dict(result)


# ============================================================================
# Checkpoint Review Endpoints
# ============================================================================


@router.get("/tickets/{ticket_id}/checkpoints")
async def list_session_checkpoints(
    ticket_id: UUID,
    status_filter: Optional[str] = None,
    user: dict = Depends(verify_jwt),
    db=Depends(get_db),
):
    """List checkpoints for a work session.

    Args:
        ticket_id: Work session UUID
        status_filter: Filter by checkpoint status (pending, resolved)
        user: Authenticated user from JWT
        db: Database connection

    Returns:
        List of work checkpoints
    """
    workspace_id = _get_workspace_id(user)

    # Verify session exists and user has access
    session_query = """
        SELECT id FROM work_tickets
        WHERE id = :ticket_id AND workspace_id = :workspace_id
    """
    session = await db.fetch_one(
        session_query,
        {"ticket_id": str(ticket_id), "workspace_id": workspace_id}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Work session not found")

    # Fetch checkpoints
    where_clauses = ["work_ticket_id = :ticket_id"]
    values = {"ticket_id": str(ticket_id)}

    if status_filter:
        where_clauses.append("status = :status")
        values["status"] = status_filter

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT * FROM work_checkpoints
        WHERE {where_sql}
        ORDER BY created_at ASC
    """

    results = await db.fetch_all(query, values)
    return [dict(row) for row in results]


@router.post("/checkpoints/{checkpoint_id}/resolve")
async def resolve_checkpoint(
    checkpoint_id: UUID,
    request: CheckpointResolveRequest,
    user: dict = Depends(verify_jwt),
    db=Depends(get_db),
):
    """Resolve a checkpoint with user decision.

    User can choose to:
    - continue: Proceed with execution and mark session as completed
    - reject: Stop execution and mark session as failed
    - modify: Request changes (Phase 1: keeps session paused)

    Args:
        checkpoint_id: Checkpoint UUID
        request: User decision and optional feedback
        user: Authenticated user from JWT
        db: Database connection

    Returns:
        Updated checkpoint and session status
    """
    workspace_id = _get_workspace_id(user)
    user_id = user.get("sub") or user.get("user_id")

    # Verify checkpoint exists and user has access
    check_query = """
        SELECT wc.id, wc.work_ticket_id, ws.workspace_id, ws.status
        FROM work_checkpoints wc
        JOIN work_tickets ws ON ws.id = wc.work_ticket_id
        WHERE wc.id = :checkpoint_id
    """
    checkpoint = await db.fetch_one(check_query, {"checkpoint_id": str(checkpoint_id)})

    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    if checkpoint["workspace_id"] != workspace_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update checkpoint
    update_checkpoint_query = """
        UPDATE work_checkpoints
        SET
            status = 'resolved',
            user_decision = :user_decision,
            resolved_by_user_id = :resolved_by_user_id,
            resolved_at = NOW()
        WHERE id = :checkpoint_id
        RETURNING *
    """

    checkpoint_values = {
        "checkpoint_id": str(checkpoint_id),
        "user_decision": request.user_decision,
        "resolved_by_user_id": user_id,
    }

    updated_checkpoint = await db.fetch_one(update_checkpoint_query, checkpoint_values)

    # Update session status based on decision
    new_session_status = None
    if request.user_decision == "continue":
        new_session_status = WorkTicketStatus.COMPLETED
    elif request.user_decision == "reject":
        new_session_status = WorkTicketStatus.FAILED
    elif request.user_decision == "modify":
        # Phase 1: Just mark as paused (future: will trigger iteration)
        new_session_status = WorkTicketStatus.PAUSED

    if new_session_status:
        update_session_query = """
            UPDATE work_tickets
            SET
                status = :status,
                ended_at = CASE WHEN :status IN ('completed', 'failed') THEN NOW() ELSE ended_at END,
                metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{last_checkpoint_decision}',
                    to_jsonb(:user_decision::text)
                )
            WHERE id = :ticket_id
        """

        await db.execute(
            update_session_query,
            {
                "ticket_id": checkpoint["work_ticket_id"],
                "status": new_session_status.value,
                "user_decision": request.user_decision,
            }
        )

    return {
        "checkpoint": dict(updated_checkpoint),
        "session_status": new_session_status.value if new_session_status else checkpoint["status"],
        "message": f"Checkpoint resolved with decision: {request.user_decision}"
    }
