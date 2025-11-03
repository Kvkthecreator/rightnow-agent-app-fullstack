"""Work checkpoint model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkCheckpointType(str, Enum):
    """Work checkpoint type."""

    PLAN_APPROVAL = "plan_approval"
    MID_WORK_REVIEW = "mid_work_review"
    ARTIFACT_REVIEW = "artifact_review"
    FINAL_APPROVAL = "final_approval"


class WorkCheckpointStatus(str, Enum):
    """Work checkpoint status."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class UserDecision(str, Enum):
    """User decision at checkpoint."""

    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"


class RiskLevel(str, Enum):
    """Risk level classification."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WorkCheckpoint(BaseModel):
    """Work checkpoint for multi-stage approval."""

    id: UUID
    work_session_id: UUID

    checkpoint_sequence: int
    checkpoint_type: WorkCheckpointType

    review_scope: str
    artifacts_at_checkpoint: List[UUID] = Field(default_factory=list)

    agent_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    agent_reasoning: Optional[str] = None
    agent_summary: Optional[str] = None

    status: WorkCheckpointStatus = WorkCheckpointStatus.PENDING

    reviewed_by_user_id: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    user_decision: Optional[UserDecision] = None
    user_feedback: Optional[str] = None
    changes_requested: Optional[Dict[str, Any]] = None

    risk_level: Optional[RiskLevel] = None
    risk_factors: Optional[Dict[str, Any]] = None

    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkCheckpointCreate(BaseModel):
    """Create work checkpoint request."""

    work_session_id: UUID
    checkpoint_sequence: int
    checkpoint_type: WorkCheckpointType
    review_scope: str
    artifacts_at_checkpoint: List[UUID] = Field(default_factory=list)
    agent_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    agent_reasoning: Optional[str] = None
    agent_summary: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    risk_factors: Optional[Dict[str, Any]] = None


class WorkCheckpointReview(BaseModel):
    """User review of work checkpoint."""

    user_decision: UserDecision
    user_feedback: Optional[str] = None
    changes_requested: Optional[Dict[str, Any]] = None
