"""Project domain model.

Projects are work domain containers that link 1:1 with substrate baskets.
They encapsulate all work tickets and outputs related to a specific context.

Phase 2e Update:
- 1:1 relationship with baskets (enforced by unique constraint)
- Container for work tickets (renamed from work_sessions)
- Simple metadata (name, description)
- No complex governance logic yet
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Project(BaseModel):
    """Project model - work domain container."""

    id: UUID
    workspace_id: UUID
    basket_id: UUID  # 1:1 link to substrate basket (context source)

    # Project metadata
    name: str
    description: Optional[str] = None

    # User tracking
    created_by_user_id: UUID

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class ProjectCreate(BaseModel):
    """Create project request."""

    workspace_id: UUID
    basket_id: UUID  # Must be unique (not already linked to another project)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
                "basket_id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "Acme Startup Marketing",
                "description": "All marketing and content work for Acme startup",
            }
        }


class ProjectUpdate(BaseModel):
    """Update project request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class ProjectWithStats(Project):
    """Project with aggregated statistics."""

    work_tickets_count: int = 0
    active_tickets_count: int = 0
    completed_tickets_count: int = 0
    total_outputs_count: int = 0

    class Config:
        """Pydantic config."""

        from_attributes = True
