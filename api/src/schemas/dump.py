from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from .base import BaseSchema


class DumpOut(BaseSchema):
    """Response schema for ``POST /dump``."""

    input_id: UUID
    chunk_ids: List[UUID]
    intent: str
    confidence: float
    commit_id: UUID
    warning: Optional[str] = None
