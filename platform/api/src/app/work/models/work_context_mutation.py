"""Work context mutation model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkMutationType(str, Enum):
    """Type of substrate mutation."""

    BLOCK_CREATED = "block_created"
    BLOCK_UPDATED = "block_updated"
    BLOCK_SUPERSEDED = "block_superseded"
    BLOCK_LOCKED = "block_locked"
    DOCUMENT_CREATED = "document_created"
    DOCUMENT_UPDATED = "document_updated"


class SubstrateType(str, Enum):
    """Type of substrate entity."""

    BLOCK = "block"
    DOCUMENT = "document"


class RiskLevel(str, Enum):
    """Risk level classification."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WorkContextMutation(BaseModel):
    """Work context mutation tracking substrate changes."""

    id: UUID
    work_session_id: UUID
    artifact_id: Optional[UUID] = None

    mutation_type: WorkMutationType

    substrate_id: UUID
    substrate_type: SubstrateType

    before_state: Optional[Dict[str, Any]] = None
    after_state: Dict[str, Any]

    mutation_risk: Optional[RiskLevel] = None
    validation_checks: Optional[Dict[str, Any]] = None

    applied_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkContextMutationCreate(BaseModel):
    """Create work context mutation request."""

    work_session_id: UUID
    artifact_id: Optional[UUID] = None
    mutation_type: WorkMutationType
    substrate_id: UUID
    substrate_type: SubstrateType
    before_state: Optional[Dict[str, Any]] = None
    after_state: Dict[str, Any]
    mutation_risk: Optional[RiskLevel] = None
    validation_checks: Optional[Dict[str, Any]] = None
