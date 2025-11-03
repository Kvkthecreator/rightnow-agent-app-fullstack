from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema


class ContextBlock(BaseSchema):
    id: Optional[UUID] = None
    user_id: str
    label: str
    content: Optional[str] = None
    file_ids: Optional[list[str]] = None
    type: str = "text"
    source: str = "parser"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_primary: bool = True
    meta_scope: str = "basket"


class DumpParserIn(BaseSchema):
    basket_id: UUID
    artifacts: list[dict]
    user_id: str


class DumpParserOut(BaseSchema):
    blocks: list[ContextBlock]
