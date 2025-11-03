from __future__ import annotations

from uuid import UUID

from .base import BaseSchema


class HighlightSuggestion(BaseSchema):
    dump_input_id: UUID
    conflicting_block_id: UUID
    reason: str
