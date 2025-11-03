"""Work artifact model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkArtifactType(str, Enum):
    """Work artifact type."""

    BLOCK_PROPOSAL = "block_proposal"
    BLOCK_UPDATE = "block_update"
    DOCUMENT_CREATION = "document_creation"
    INSIGHT = "insight"
    EXTERNAL_DELIVERABLE = "external_deliverable"


class WorkArtifactStatus(str, Enum):
    """Work artifact status."""

    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLIED_TO_SUBSTRATE = "applied_to_substrate"


class RiskLevel(str, Enum):
    """Risk level classification."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WorkArtifact(BaseModel):
    """Work artifact representing output of agent work."""

    id: UUID
    work_session_id: UUID
    checkpoint_id: Optional[UUID] = None

    artifact_type: WorkArtifactType
    content: Dict[str, Any]

    becomes_block_id: Optional[UUID] = None
    supersedes_block_id: Optional[UUID] = None
    creates_document_id: Optional[UUID] = None

    external_url: Optional[str] = None
    external_type: Optional[str] = None

    agent_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    agent_reasoning: Optional[str] = None
    source_context_ids: List[UUID] = Field(default_factory=list)

    status: WorkArtifactStatus = WorkArtifactStatus.DRAFT

    risk_level: Optional[RiskLevel] = None
    risk_factors: Optional[Dict[str, Any]] = None

    reviewed_by_user_id: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    review_decision: Optional[str] = None
    review_feedback: Optional[str] = None

    created_at: datetime
    applied_at: Optional[datetime] = None

    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkArtifactCreate(BaseModel):
    """Create work artifact request."""

    work_session_id: UUID
    artifact_type: WorkArtifactType
    content: Dict[str, Any]
    agent_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    agent_reasoning: Optional[str] = None
    source_context_ids: List[UUID] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkArtifactUpdate(BaseModel):
    """Update work artifact request."""

    status: Optional[WorkArtifactStatus] = None
    becomes_block_id: Optional[UUID] = None
    supersedes_block_id: Optional[UUID] = None
    creates_document_id: Optional[UUID] = None
    risk_level: Optional[RiskLevel] = None
    risk_factors: Optional[Dict[str, Any]] = None
    reviewed_by_user_id: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    review_decision: Optional[str] = None
    review_feedback: Optional[str] = None
    applied_at: Optional[datetime] = None
