from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from .base import BaseSchema


class Basket(BaseSchema):
    """Representation of a basket row."""

    id: Optional[UUID] = None
    user_id: str
    name: Optional[str] = None
    raw_dump: Optional[str] = None
    status: str = "draft"
    tags: Optional[List[str]] = None
    commentary: Optional[str] = None
    mode: Optional[str] = None


class BasketOut(BaseSchema):
    """Payload returned by ``GET /baskets/{id}``."""

    id: UUID
    status: Optional[str] = None
    name: Optional[str] = None
    raw_dump: Optional[str] = None
    tags: Optional[List[str]] = None
    commentary: Optional[str] = None
    blocks: List[dict]
    configs: List[dict]
    mode: Optional[str] = None
