from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema


class ContextBlock(BaseSchema):
    """Core schema for a single context block."""

    id: UUID | None = None
    user_id: str
    label: str
    content: str | None = None
    file_ids: list[str] | None = None
    type: str = "text"
    source: str = "parser"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_primary: bool = True

    # Fields not yet persisted in the DB
    update_policy: str | None = None
    is_core_block: bool | None = None
    associated_block_id: str | None = None
    meta_scope: str | None = None
    meta_context_scope: str | None = None
    meta_tags: list[str] | None = None
    meta_emotional_tone: list[str] | None = None
    meta_locale: str | None = None
    tags: Optional[list[str]] = None
    # link straight back to its basket (added 2024-06-11)
    basket_id: Optional[UUID] = None

    def model_dump(self, *, mode: str = "python", exclude_none: bool = False) -> dict:
        """Compatibility wrapper for Pydantic v1."""
        return self.dict(exclude_none=exclude_none)
