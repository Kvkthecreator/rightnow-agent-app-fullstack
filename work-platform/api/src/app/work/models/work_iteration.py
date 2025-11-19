"""Work iteration model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class WorkIterationTrigger(str, Enum):
    """What triggered the iteration."""

    CHECKPOINT_REJECTION = "checkpoint_rejection"
    USER_FEEDBACK = "user_feedback"
    AGENT_SELF_CORRECTION = "agent_self_correction"
    CONTEXT_STALENESS = "context_staleness"


class WorkIteration(BaseModel):
    """Work iteration tracking feedback loops."""

    id: UUID
    work_ticket_id: UUID

    iteration_number: int

    triggered_by: WorkIterationTrigger

    user_feedback_text: Optional[str] = None
    changes_requested: Optional[Dict[str, Any]] = None

    agent_interpretation: Optional[str] = None
    revised_approach: Optional[str] = None
    outputs_revised: List[UUID] = Field(default_factory=list)

    resolved: bool = False
    resolved_at: Optional[datetime] = None

    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkIterationCreate(BaseModel):
    """Create work iteration request."""

    work_ticket_id: UUID
    iteration_number: int
    triggered_by: WorkIterationTrigger
    user_feedback_text: Optional[str] = None
    changes_requested: Optional[Dict[str, Any]] = None
    agent_interpretation: Optional[str] = None
    revised_approach: Optional[str] = None
    outputs_revised: List[UUID] = Field(default_factory=list)
