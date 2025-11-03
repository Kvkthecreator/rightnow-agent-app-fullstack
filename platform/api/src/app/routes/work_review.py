"""
Work Review API - YARNNN v4.0 Unified Governance

Single endpoint for work review that applies approved artifacts to substrate.
Calls UnifiedApprovalOrchestrator for governance logic.

This is the core v4.0 innovation:
- Single user review → dual effect (work quality + substrate mutation)
- No double-approval required (work approval, then separate substrate approval)
- Per-artifact decisions (apply, save as draft, or reject)
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.utils.jwt import verify_jwt
from app.utils.supabase_client import supabase_admin_client as supabase
from app.governance.unified_approval import (
    UnifiedApprovalOrchestrator,
    WorkReviewDecision,
    ArtifactDecision,
)

router = APIRouter(prefix="/api/work/review", tags=["work-review"])


class ReviewRequest(BaseModel):
    """Request to review work session."""
    work_quality: str  # 'approved' or 'rejected'
    feedback: Optional[str] = None
    artifacts: Dict[str, str]  # artifact_id → 'apply_to_substrate' | 'save_as_draft' | 'reject'
    artifact_feedback: Dict[str, str] = {}


class ReviewResponse(BaseModel):
    """Result of work review."""
    status: str  # 'approved', 'rejected', or 'partial'
    reason: Optional[str] = None
    artifacts_applied: int
    substrate_mutations: List[str]
    rejected_artifacts: List[str]


@router.post("/{session_id}", response_model=ReviewResponse)
async def review_work_session(
    session_id: UUID,
    request: ReviewRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Review work session and apply approved artifacts to substrate.

    This is the core v4.0 unified governance endpoint.

    Single user review → dual effect:
    1. Work quality assessment (approve/reject the agent's work)
    2. Substrate mutation application (if approved, apply changes to substrate)

    Per-artifact control:
    - 'apply_to_substrate': Approve artifact and apply to substrate immediately
    - 'save_as_draft': Approve artifact but keep as draft (don't apply to substrate yet)
    - 'reject': Reject this artifact

    Example usage:
    ```
    POST /api/work/review/{session_id}
    {
      "work_quality": "approved",
      "feedback": "Great research, well-sourced",
      "artifacts": {
        "artifact-1-uuid": "apply_to_substrate",
        "artifact-2-uuid": "save_as_draft",
        "artifact-3-uuid": "reject"
      },
      "artifact_feedback": {
        "artifact-3-uuid": "This insight needs more evidence"
      }
    }
    ```

    Returns:
    - status: Overall approval status
    - artifacts_applied: How many artifacts were applied to substrate
    - substrate_mutations: List of substrate mutation IDs created
    - rejected_artifacts: List of rejected artifact IDs
    """
    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Verify work session exists and user has access
    session_response = supabase.table("work_sessions").select(
        "id, user_id, workspace_id, status"
    ).eq("id", str(session_id)).single().execute()

    if not session_response.data:
        raise HTTPException(status_code=404, detail="Work session not found")

    session = session_response.data

    # Verify user owns the work session or is workspace admin
    if session['user_id'] != user_id:
        # Check if user is workspace admin
        membership_response = supabase.table("workspace_memberships").select(
            "role"
        ).eq("user_id", user_id).eq("workspace_id", session['workspace_id']).execute()

        if not membership_response.data or membership_response.data[0].get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Access denied: Only work owner or workspace admin can review")

    # Verify work session is in reviewable state
    if session['status'] not in ['completed', 'pending_review']:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot review work with status: {session['status']}. Work must be completed first."
        )

    # Convert request to WorkReviewDecision
    try:
        artifact_decisions = {}
        for artifact_id, decision_str in request.artifacts.items():
            artifact_decisions[UUID(artifact_id)] = ArtifactDecision(decision_str)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid artifact decision: {str(e)}. Must be 'apply_to_substrate', 'save_as_draft', or 'reject'"
        )

    artifact_feedback_uuids = {}
    for artifact_id, feedback in request.artifact_feedback.items():
        artifact_feedback_uuids[UUID(artifact_id)] = feedback

    decision = WorkReviewDecision(
        work_quality=request.work_quality,
        feedback=request.feedback,
        artifacts=artifact_decisions,
        artifact_feedback=artifact_feedback_uuids
    )

    # Call UnifiedApprovalOrchestrator (this is where the 485 lines of governance logic runs)
    try:
        orchestrator = UnifiedApprovalOrchestrator(supabase)
        result = await orchestrator.review_work_session(
            work_session_id=session_id,
            user_id=UUID(user_id),
            decision=decision
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process review: {str(e)}"
        )

    # Update work session status based on result
    new_status = 'approved' if result.status == 'approved' else 'rejected'
    if result.status == 'partial':
        new_status = 'partially_approved'

    supabase.table("work_sessions").update({
        'status': new_status,
        'completed_at': datetime.utcnow().isoformat()
    }).eq("id", str(session_id)).execute()

    # Return result
    return ReviewResponse(
        status=result.status,
        reason=result.reason,
        artifacts_applied=result.artifacts_applied,
        substrate_mutations=[str(m) for m in result.substrate_mutations],
        rejected_artifacts=[str(r) for r in result.rejected_artifacts]
    )


@router.get("/{session_id}/reviewable")
async def check_work_reviewable(
    session_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """
    Check if work session is ready for review.

    Returns:
    - reviewable: bool (true if work can be reviewed)
    - reason: str (explanation of reviewable status)
    - artifacts_count: int (number of artifacts to review)
    """
    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get session
    session_response = supabase.table("work_sessions").select(
        "*"
    ).eq("id", str(session_id)).single().execute()

    if not session_response.data:
        raise HTTPException(status_code=404, detail="Work session not found")

    session = session_response.data

    # Verify access
    access_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).eq("workspace_id", session['workspace_id']).execute()

    if not access_response.data:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if reviewable
    reviewable = session['status'] in ['completed', 'pending_review']
    reason = "Work is ready for review"

    if session['status'] == 'pending':
        reason = "Work has not started yet"
    elif session['status'] == 'processing':
        reason = "Work is still in progress"
    elif session['status'] == 'failed':
        reason = "Work failed and must be retried before review"
    elif session['status'] in ['approved', 'rejected']:
        reason = "Work has already been reviewed"

    # Count artifacts
    artifacts_response = supabase.table("work_artifacts").select(
        "id"
    ).eq("work_session_id", str(session_id)).execute()

    artifacts_count = len(artifacts_response.data or [])

    return {
        "reviewable": reviewable,
        "reason": reason,
        "artifacts_count": artifacts_count,
        "current_status": session['status']
    }
