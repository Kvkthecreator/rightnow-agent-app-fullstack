from __future__ import annotations

from datetime import date, datetime, timezone
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

    # Optional DB fields
    update_policy: str | None = None
    meta_scope: str | None = None
    meta_context_scope: str | None = None
    meta_tags: list[str] | None = None
    meta_emotional_tone: list[str] | None = None
    meta_locale: str | None = None
    tags: list[str] | None = None
    # link straight back to its basket (added 2024-06-11)
    basket_id: UUID | None = None
    is_draft: bool | None = None
    commit_id: UUID | None = None
    updated_at: datetime | None = None

    # --- pydantic-v1 JSON compat -----------------
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }

    def model_dump(
        self,
        *,
        mode: str = "python",
        exclude_none: bool = False,
        **_: None,
    ) -> dict:
        """Compatibility wrapper for Pydantic v1 without recursion."""
        data = self.__dict__.copy()
        if exclude_none:
            data = {k: v for k, v in data.items() if v is not None}
        return data

    def dict(self, *args, **kwargs):  # type: ignore[override]
        """Backwards compatibility for tests expecting BaseModel.dict."""
        return self.model_dump(**kwargs)
