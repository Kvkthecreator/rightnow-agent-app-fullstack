"""Work session model (Phase 1).

Work sessions represent individual work requests within a project.
Each session executes an agent with:
- Context: From linked basket (substrate blocks)
- Task: User-provided intent and parameters

Phase 1 Scope:
- Execute agent with context + task
- Collect artifacts during execution
- Checkpoint for user review
- Store artifact review status (NO substrate application yet)
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TaskType(str, Enum):
    """Task type classification (simplified for Phase 1)."""

    RESEARCH = "research"
    CONTENT_CREATION = "content_creation"
    ANALYSIS = "analysis"


class WorkSessionStatus(str, Enum):
    """Work session execution status."""

    PENDING = "pending"  # Created, not yet started
    RUNNING = "running"  # Agent is executing
    PAUSED = "paused"  # At checkpoint, waiting for user decision
    COMPLETED = "completed"  # Successfully finished
    FAILED = "failed"  # Execution failed


class WorkSession(BaseModel):
    """Work session model - individual work request."""

    id: UUID

    # Relationships
    project_id: UUID  # Which project this belongs to
    basket_id: UUID  # Context source (denormalized from project)
    workspace_id: UUID  # Workspace (denormalized from project)
    initiated_by_user_id: UUID

    # Task definition (from user input)
    task_type: TaskType
    task_intent: str  # Natural language: "Write LinkedIn post about our startup"
    task_parameters: Dict[str, Any] = Field(default_factory=dict)  # JSONB: flexible params

    # Execution state
    status: WorkSessionStatus = WorkSessionStatus.PENDING
    executed_by_agent_id: Optional[str] = None  # e.g., 'research_agent'

    # Timestamps
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    # Execution metadata (step progress, errors, etc.)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        from_attributes = True


class WorkSessionCreate(BaseModel):
    """Create work session request."""

    project_id: UUID
    task_type: TaskType
    task_intent: str = Field(..., min_length=1, max_length=1000)
    task_parameters: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "task_type": "content_creation",
                "task_intent": "Write a LinkedIn post about our AI sales assistant product",
                "task_parameters": {
                    "platform": "linkedin",
                    "target_audience": "sales leaders",
                    "tone": "professional",
                    "length": "short",
                    "cta": "Book a demo",
                },
            }
        }


class WorkSessionUpdate(BaseModel):
    """Update work session (used internally by executor)."""

    status: Optional[WorkSessionStatus] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    executed_by_agent_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
