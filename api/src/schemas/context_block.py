from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import UUID

from pydantic import Field

from .base import BaseSchema


class ContextBlock(BaseSchema):
    """Core schema for a single context block."""

    id: UUID | None = None
    basket_id: UUID | None = None
    type: str
    content: str
    status: str = "proposed"
    order: int | None = None
    meta_tags: list[str] | None = None
    origin: str | None = None

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
