"""Work session model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkSessionStatus(str, Enum):
    """Work session status."""

    INITIALIZED = "initialized"
    IN_PROGRESS = "in_progress"
    AWAITING_CHECKPOINT = "awaiting_checkpoint"
    AWAITING_FINAL_APPROVAL = "awaiting_final_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class WorkSessionApprovalStrategy(str, Enum):
    """Approval strategy for work sessions."""

    CHECKPOINT_REQUIRED = "checkpoint_required"
    FINAL_ONLY = "final_only"
    AUTO_APPROVE_LOW_RISK = "auto_approve_low_risk"


class TaskType(str, Enum):
    """Task type classification."""

    RESEARCH = "research"
    SYNTHESIS = "synthesis"
    ANALYSIS = "analysis"
    COMPOSITION = "composition"
    UPDATE = "update"


class WorkSession(BaseModel):
    """Work session tracking agent execution."""

    id: UUID
    workspace_id: UUID
    basket_id: UUID
    initiated_by_user_id: UUID
    executed_by_agent_id: Optional[str] = None
    agent_session_id: Optional[str] = None

    task_intent: str
    task_type: TaskType
    task_document_id: Optional[UUID] = None

    status: WorkSessionStatus = WorkSessionStatus.INITIALIZED
    approval_strategy: WorkSessionApprovalStrategy = WorkSessionApprovalStrategy.FINAL_ONLY
    confidence_threshold: float = Field(default=0.85, ge=0.0, le=1.0)

    reasoning_trail: List[Dict[str, Any]] = Field(default_factory=list)
    context_snapshot: Optional[Dict[str, Any]] = None

    artifacts_count: int = 0
    substrate_mutations_count: int = 0

    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkSessionCreate(BaseModel):
    """Create work session request."""

    workspace_id: UUID
    basket_id: UUID
    task_intent: str
    task_type: TaskType
    task_document_id: Optional[UUID] = None
    approval_strategy: WorkSessionApprovalStrategy = WorkSessionApprovalStrategy.FINAL_ONLY
    confidence_threshold: float = Field(default=0.85, ge=0.0, le=1.0)
    executed_by_agent_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkSessionUpdate(BaseModel):
    """Update work session request."""

    status: Optional[WorkSessionStatus] = None
    agent_session_id: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    reasoning_trail: Optional[List[Dict[str, Any]]] = None
    context_snapshot: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
