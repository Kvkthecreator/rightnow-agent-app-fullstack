"""
Work Tickets API - YARNNN Phase 2e

Uses work_tickets table (new schema after Phase 2e refactor).
Work tickets track execution of work requests by agent sessions.

This replaces work_sessions.py with the new schema:
- work_tickets (execution tracking)
- work_requests (user asks)
- agent_sessions (persistent agent state)
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from app.utils.jwt import verify_jwt
from app.utils.supabase_client import supabase_admin_client as supabase

router = APIRouter(prefix="/api/work/tickets", tags=["work-tickets"])


class CreateWorkTicketRequest(BaseModel):
    """Request to create new work ticket."""
    task_description: str
    basket_id: UUID
    agent_type: str  # 'research', 'content', 'reporting'
    context: Optional[dict] = {}
    priority: Optional[str] = 'normal'  # 'low', 'normal', 'high', 'urgent'


class WorkTicketResponse(BaseModel):
    """Work ticket with outputs."""
    id: str
    work_request_id: str
    agent_session_id: Optional[str]
    task_description: str  # Denormalized from work_request
    status: str  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    basket_id: str
    workspace_id: str
    agent_type: str
    outputs_count: int
    checkpoints_count: int
    iterations_count: int
    error_message: Optional[str]


class WorkTicketListResponse(BaseModel):
    """List of work tickets with pagination."""
    tickets: List[WorkTicketResponse]
    total_count: int
    pending_count: int
    running_count: int
    completed_count: int
    failed_count: int


@router.post("/", response_model=WorkTicketResponse)
async def create_work_ticket(
    request: CreateWorkTicketRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Create new work ticket (with work_request).

    Agent session will execute task and produce outputs for review.
    """
    user_id = user.get('sub') or user.get('user_id')
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

    # Create work_request first
    work_request_data = {
        "workspace_id": workspace_id,
        "basket_id": str(request.basket_id),
        "requested_by_user_id": user_id,
        "request_type": request.agent_type,  # Using agent_type as request_type
        "task_intent": request.task_description,
        "parameters": request.context or {},
        "priority": request.priority,
        "requested_at": datetime.utcnow().isoformat()
    }

    work_request_response = supabase.table("work_requests").insert(work_request_data).execute()

    if not work_request_response.data:
        raise HTTPException(status_code=500, detail="Failed to create work request")

    work_request = work_request_response.data[0]

    # Create work_ticket for execution tracking
    ticket_data = {
        "work_request_id": work_request['id'],
        "workspace_id": workspace_id,
        "basket_id": str(request.basket_id),
        "agent_type": request.agent_type,
        "status": "pending",
        "outputs_count": 0,
        "checkpoints_count": 0,
        "iterations_count": 0,
        "metadata": {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    ticket_response = supabase.table("work_tickets").insert(ticket_data).execute()

    if not ticket_response.data:
        raise HTTPException(status_code=500, detail="Failed to create work ticket")

    ticket = ticket_response.data[0]

    # TODO: Trigger agent execution (integrate with agent sessions)
    # For now, ticket is created and waits for agent pickup

    return WorkTicketResponse(
        id=ticket['id'],
        work_request_id=work_request['id'],
        agent_session_id=None,
        task_description=work_request['task_intent'],
        status=ticket['status'],
        created_at=ticket['created_at'],
        started_at=None,
        completed_at=None,
        basket_id=ticket['basket_id'],
        workspace_id=ticket['workspace_id'],
        agent_type=ticket['agent_type'],
        outputs_count=0,
        checkpoints_count=0,
        iterations_count=0,
        error_message=None
    )


@router.get("/{ticket_id}", response_model=WorkTicketResponse)
async def get_work_ticket(
    ticket_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """
    Get work ticket details with outputs count.
    """
    user_id = user.get('sub') or user.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get ticket
    ticket_response = supabase.table("work_tickets").select(
        "*"
    ).eq("id", str(ticket_id)).single().execute()

    if not ticket_response.data:
        raise HTTPException(status_code=404, detail="Work ticket not found")

    ticket = ticket_response.data

    # Verify user has access to this workspace
    access_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).eq("workspace_id", ticket['workspace_id']).execute()

    if not access_response.data:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get work_request for task description
    work_request_response = supabase.table("work_requests").select(
        "task_intent"
    ).eq("id", ticket['work_request_id']).single().execute()

    task_description = work_request_response.data['task_intent'] if work_request_response.data else ""

    return WorkTicketResponse(
        id=ticket['id'],
        work_request_id=ticket['work_request_id'],
        agent_session_id=ticket.get('agent_session_id'),
        task_description=task_description,
        status=ticket['status'],
        created_at=ticket['created_at'],
        started_at=ticket.get('started_at'),
        completed_at=ticket.get('completed_at'),
        basket_id=ticket['basket_id'],
        workspace_id=ticket['workspace_id'],
        agent_type=ticket['agent_type'],
        outputs_count=ticket.get('outputs_count', 0),
        checkpoints_count=ticket.get('checkpoints_count', 0),
        iterations_count=ticket.get('iterations_count', 0),
        error_message=ticket.get('error_message')
    )


@router.get("/", response_model=WorkTicketListResponse)
async def list_work_tickets(
    user: dict = Depends(verify_jwt),
    status: Optional[str] = Query(None, description="Filter by status"),
    basket_id: Optional[str] = Query(None, description="Filter by basket"),
    limit: int = Query(20, description="Max results", le=100),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    List user's work tickets.
    """
    user_id = user.get('sub') or user.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get user's workspaces
    workspaces_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).execute()

    if not workspaces_response.data:
        return WorkTicketListResponse(
            tickets=[],
            total_count=0,
            pending_count=0,
            running_count=0,
            completed_count=0,
            failed_count=0
        )

    workspace_ids = [w['workspace_id'] for w in workspaces_response.data]

    # Build query
    query = supabase.table("work_tickets").select(
        "*"
    ).in_("workspace_id", workspace_ids).order("created_at", desc=True)

    if status:
        query = query.eq("status", status)
    if basket_id:
        query = query.eq("basket_id", basket_id)

    query = query.range(offset, offset + limit - 1)

    tickets_response = query.execute()
    tickets = tickets_response.data or []

    # Get work_requests for task descriptions
    work_request_ids = [t['work_request_id'] for t in tickets]
    work_requests_response = supabase.table("work_requests").select(
        "id, task_intent"
    ).in_("id", work_request_ids).execute()

    work_requests_map = {wr['id']: wr['task_intent'] for wr in (work_requests_response.data or [])}

    # Build ticket responses
    ticket_responses = []
    for ticket in tickets:
        task_description = work_requests_map.get(ticket['work_request_id'], "")

        ticket_responses.append(WorkTicketResponse(
            id=ticket['id'],
            work_request_id=ticket['work_request_id'],
            agent_session_id=ticket.get('agent_session_id'),
            task_description=task_description,
            status=ticket['status'],
            created_at=ticket['created_at'],
            started_at=ticket.get('started_at'),
            completed_at=ticket.get('completed_at'),
            basket_id=ticket['basket_id'],
            workspace_id=ticket['workspace_id'],
            agent_type=ticket['agent_type'],
            outputs_count=ticket.get('outputs_count', 0),
            checkpoints_count=ticket.get('checkpoints_count', 0),
            iterations_count=ticket.get('iterations_count', 0),
            error_message=ticket.get('error_message')
        ))

    # Get counts for summary
    counts_response = supabase.table("work_tickets").select(
        "status"
    ).in_("workspace_id", workspace_ids).execute()

    status_counts = {}
    total_count = 0
    for ticket in (counts_response.data or []):
        state = ticket['status']
        status_counts[state] = status_counts.get(state, 0) + 1
        total_count += 1

    return WorkTicketListResponse(
        tickets=ticket_responses,
        total_count=total_count,
        pending_count=status_counts.get('pending', 0),
        running_count=status_counts.get('running', 0),
        completed_count=status_counts.get('completed', 0),
        failed_count=status_counts.get('failed', 0)
    )


@router.post("/{ticket_id}/retry")
async def retry_work_ticket(
    ticket_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """
    Retry failed work ticket by resetting to pending state.
    """
    user_id = user.get('sub') or user.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Get ticket
    ticket_response = supabase.table("work_tickets").select(
        "*"
    ).eq("id", str(ticket_id)).single().execute()

    if not ticket_response.data:
        raise HTTPException(status_code=404, detail="Work ticket not found")

    ticket = ticket_response.data

    # Verify user has access
    access_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).eq("workspace_id", ticket['workspace_id']).execute()

    if not access_response.data:
        raise HTTPException(status_code=403, detail="Access denied")

    # Only allow retry of failed work
    if ticket['status'] != 'failed':
        raise HTTPException(
            status_code=400,
            detail=f"Cannot retry work with status: {ticket['status']}"
        )

    # Reset to pending state
    supabase.table("work_tickets").update({
        'status': 'pending',
        'error_message': None,
        'completed_at': None,
        'updated_at': datetime.utcnow().isoformat()
    }).eq("id", str(ticket_id)).execute()

    return {"message": "Work ticket reset to pending for retry", "ticket_id": str(ticket_id)}
