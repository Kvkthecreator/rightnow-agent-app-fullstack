from typing import Literal, Optional
from uuid import UUID

from .base import BaseSchema
from .dump_parser import ContextBlock


class BlockDiffIn(BaseSchema):
    basket_id: UUID


class DiffBlock(BaseSchema):
    type: Literal["added", "modified", "unchanged"]
    new_block: ContextBlock
    old_block: Optional[ContextBlock] = None
    reason: Optional[str] = None


class BlockDiffOut(BaseSchema):
    diffs: list[DiffBlock]
