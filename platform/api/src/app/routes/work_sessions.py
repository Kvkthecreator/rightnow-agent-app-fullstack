"""
Work Sessions API - YARNNN v4.0

Replaces work_status.py (v2.1) for the Work Platform.
Uses work_sessions table instead of agent_processing_queue.

This is the primary endpoint for creating and managing work sessions
where agents execute tasks and produce artifacts for user review.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from app.utils.jwt import verify_jwt
from app.utils.supabase_client import supabase_admin_client as supabase

router = APIRouter(prefix="/api/work/sessions", tags=["work-sessions"])


class CreateWorkSessionRequest(BaseModel):
    """Request to create new work session."""
    task_description: str
    basket_id: UUID
    agent_type: str  # 'research', 'content', 'reporting'
    context: Optional[dict] = {}
    priority: Optional[int] = 5


class WorkSessionResponse(BaseModel):
    """Work session with artifacts."""
    id: str
    task_description: str
    status: str  # 'pending', 'processing', 'completed', 'failed'
    created_at: str
    completed_at: Optional[str]
    basket_id: str
    workspace_id: str
    agent_type: str
    artifacts: List[dict]


class WorkSessionListResponse(BaseModel):
    """List of work sessions with pagination."""
    sessions: List[WorkSessionResponse]
    total_count: int
    pending_count: int
    processing_count: int
    completed_count: int
    failed_count: int


@router.post("/", response_model=WorkSessionResponse)
async def create_work_session(
    request: CreateWorkSessionRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Create new work session.

    Agent will execute task and produce artifacts for review.
    This replaces the old /api/work/initiate endpoint.
    """
    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get user's workspace
    workspace_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).limit(1).execute()

    if not workspace_response.data:
        raise HTTPException(status_code=403, detail="User has no workspace")

    workspace_id = workspace_response.data[0]['workspace_id']

    # Validate basket access
    basket_response = supabase.table("baskets").select(
        "id"
    ).eq("id", str(request.basket_id)).eq("workspace_id", workspace_id).execute()

    if not basket_response.data:
        raise HTTPException(status_code=404, detail="Basket not found or access denied")

    # Create work session in database
    session_data = {
        "task_description": request.task_description,
        "basket_id": str(request.basket_id),
        "workspace_id": workspace_id,
        "user_id": user_id,
        "agent_type": request.agent_type,
        "status": "pending",
        "context": request.context,
        "priority": request.priority,
        "created_at": datetime.utcnow().isoformat()
    }

    session_response = supabase.table("work_sessions").insert(session_data).execute()

    if not session_response.data:
        raise HTTPException(status_code=500, detail="Failed to create work session")

    session = session_response.data[0]

    # TODO: Trigger agent execution (integrate with yarnnn-claude-agents)
    # For now, session is created and waits for agent pickup

    return WorkSessionResponse(
        id=session['id'],
        task_description=session['task_description'],
        status=session['status'],
        created_at=session['created_at'],
        completed_at=None,
        basket_id=session['basket_id'],
        workspace_id=session['workspace_id'],
        agent_type=session['agent_type'],
        artifacts=[]
    )


@router.get("/{session_id}", response_model=WorkSessionResponse)
async def get_work_session(
    session_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """
    Get work session details with artifacts.

    Replaces /api/work/{work_id}/status endpoint.
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

    # Verify user has access to this workspace
    access_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).eq("workspace_id", session['workspace_id']).execute()

    if not access_response.data:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get artifacts
    artifacts_response = supabase.table("work_artifacts").select(
        "*"
    ).eq("work_session_id", str(session_id)).execute()

    artifacts = artifacts_response.data or []

    return WorkSessionResponse(
        id=session['id'],
        task_description=session['task_description'],
        status=session['status'],
        created_at=session['created_at'],
        completed_at=session.get('completed_at'),
        basket_id=session['basket_id'],
        workspace_id=session['workspace_id'],
        agent_type=session['agent_type'],
        artifacts=artifacts
    )


@router.get("/", response_model=WorkSessionListResponse)
async def list_work_sessions(
    user: dict = Depends(verify_jwt),
    status: Optional[str] = Query(None, description="Filter by status"),
    basket_id: Optional[str] = Query(None, description="Filter by basket"),
    limit: int = Query(20, description="Max results", le=100),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    List user's work sessions.

    Replaces /api/work/ list endpoint.
    """
    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get user's workspaces
    workspaces_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).execute()

    if not workspaces_response.data:
        return WorkSessionListResponse(
            sessions=[],
            total_count=0,
            pending_count=0,
            processing_count=0,
            completed_count=0,
            failed_count=0
        )

    workspace_ids = [w['workspace_id'] for w in workspaces_response.data]

    # Build query
    query = supabase.table("work_sessions").select(
        "*"
    ).in_("workspace_id", workspace_ids).order("created_at", desc=True)

    if status:
        query = query.eq("status", status)
    if basket_id:
        query = query.eq("basket_id", basket_id)

    query = query.range(offset, offset + limit - 1)

    sessions_response = query.execute()
    sessions = sessions_response.data or []

    # Get artifacts for each session
    session_responses = []
    for session in sessions:
        artifacts_response = supabase.table("work_artifacts").select(
            "*"
        ).eq("work_session_id", session['id']).execute()

        session_responses.append(WorkSessionResponse(
            id=session['id'],
            task_description=session['task_description'],
            status=session['status'],
            created_at=session['created_at'],
            completed_at=session.get('completed_at'),
            basket_id=session['basket_id'],
            workspace_id=session['workspace_id'],
            agent_type=session['agent_type'],
            artifacts=artifacts_response.data or []
        ))

    # Get counts for summary
    counts_response = supabase.table("work_sessions").select(
        "status, count:id.count()"
    ).in_("workspace_id", workspace_ids).execute()

    status_counts = {}
    total_count = 0
    for count_item in (counts_response.data or []):
        state = count_item['status']
        count = count_item.get('count', 0)
        status_counts[state] = count
        total_count += count

    return WorkSessionListResponse(
        sessions=session_responses,
        total_count=total_count,
        pending_count=status_counts.get('pending', 0),
        processing_count=status_counts.get('processing', 0),
        completed_count=status_counts.get('completed', 0),
        failed_count=status_counts.get('failed', 0)
    )


@router.post("/{session_id}/retry")
async def retry_work_session(
    session_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """
    Retry failed work session by resetting to pending state.

    Replaces /api/work/{work_id}/retry endpoint.
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

    # Verify user has access
    access_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).eq("workspace_id", session['workspace_id']).execute()

    if not access_response.data:
        raise HTTPException(status_code=403, detail="Access denied")

    # Only allow retry of failed work
    if session['status'] != 'failed':
        raise HTTPException(
            status_code=400,
            detail=f"Cannot retry work with status: {session['status']}"
        )

    # Reset to pending state
    supabase.table("work_sessions").update({
        'status': 'pending',
        'error_message': None,
        'completed_at': None
    }).eq("id", str(session_id)).execute()

    return {"message": "Work session reset to pending for retry", "session_id": str(session_id)}
