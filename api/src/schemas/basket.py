from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from .base import BaseSchema


class Basket(BaseSchema):
    """Representation of a basket row."""

    id: Optional[UUID] = None
    user_id: str
    intent: Optional[str] = None
    sub_instructions: Optional[str] = None
    media: Optional[dict] = None
    core_profile_data: Optional[dict] = None
    created_at: Optional[datetime] = None
    core_context_snapshot: Optional[dict] = None
    is_draft: bool = True
    is_published: bool = False
    is_locked: bool = False
    meta_emotional_tone: Optional[List[str]] = None
    meta_scope: Optional[str] = None
    meta_audience: Optional[str] = None
    updated_at: Optional[datetime] = None
    compilation_mode: str = "summary"
    intent_summary: Optional[str] = None
    status: str = "draft"
    raw_dump: Optional[str] = None


class BasketOut(BaseSchema):
    """Payload returned by ``GET /baskets/{id}``."""

    id: UUID
    status: Optional[str] = None
    intent_summary: Optional[str] = None
    blocks: List[dict]
    configs: List[dict]
