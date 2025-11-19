"""Work ticket model (Phase 2e).

Work tickets track individual work execution within the new work orchestration system.
Each ticket represents an execution attempt of an agent session.

Schema Changes (Phase 2e):
- Renamed from work_sessions to work_tickets
- Added work_request_id FK to work_requests
- Added agent_session_id FK to agent_sessions
- Removed approval_strategy, confidence_threshold (governance removed)
- Simplified status values
- Added agent_type denormalized field
- Added reasoning_trail, context_snapshot
- Added outputs_count, checkpoints_count, iterations_count
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TaskType(str, Enum):
    """Task type classification."""

    RESEARCH = "research"
    CONTENT_CREATION = "content_creation"
    ANALYSIS = "analysis"


class WorkTicketStatus(str, Enum):
    """Work ticket execution status."""

    PENDING = "pending"  # Waiting to start
    RUNNING = "running"  # Currently executing
    COMPLETED = "completed"  # Successfully finished
    FAILED = "failed"  # Execution failed
    CANCELLED = "cancelled"  # User cancelled


class WorkTicket(BaseModel):
    """Work ticket model - tracks individual work execution."""

    id: UUID

    # Relationships
    work_request_id: UUID  # Parent work request
    agent_session_id: Optional[UUID] = None  # Agent session executing this

    # Denormalized for queries
    workspace_id: UUID
    basket_id: UUID
    agent_type: str  # 'research', 'content', 'reporting'

    # Execution state
    status: WorkTicketStatus = WorkTicketStatus.PENDING

    # Execution details
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    # Work trail
    reasoning_trail: List[Dict[str, Any]] = Field(default_factory=list)
    context_snapshot: Optional[Dict[str, Any]] = None

    # Outcomes
    outputs_count: int = 0
    checkpoints_count: int = 0
    iterations_count: int = 0

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkTicketCreate(BaseModel):
    """Create work ticket request."""

    work_request_id: UUID
    agent_session_id: Optional[UUID] = None
    workspace_id: UUID
    basket_id: UUID
    agent_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "work_request_id": "123e4567-e89b-12d3-a456-426614174000",
                "agent_session_id": "223e4567-e89b-12d3-a456-426614174000",
                "workspace_id": "323e4567-e89b-12d3-a456-426614174000",
                "basket_id": "423e4567-e89b-12d3-a456-426614174000",
                "agent_type": "research",
                "metadata": {},
            }
        }


class WorkTicketUpdate(BaseModel):
    """Update work ticket (used internally by executor)."""

    status: Optional[WorkTicketStatus] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    reasoning_trail: Optional[List[Dict[str, Any]]] = None
    context_snapshot: Optional[Dict[str, Any]] = None
    outputs_count: Optional[int] = None
    checkpoints_count: Optional[int] = None
    iterations_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
