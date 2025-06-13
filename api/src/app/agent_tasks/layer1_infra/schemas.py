"""Pydantic models for Layer-1 infrastructure agents."""

from datetime import datetime
from typing import List

from schemas.base import BaseSchema


class DuplicateLabel(BaseSchema):
    label: str
    block_ids: List[str]

class AuditReport(BaseSchema):
    ok: bool
    duplicate_labels: List[DuplicateLabel]
    generated_at: str  # ISO ts

class UsageReport(BaseSchema):
    stale_ids: List[str]
    unused_ids: List[str]
    generated_at: datetime

class RefreshReport(BaseSchema):
    refreshed_ids: List[str]
    proposed_ids: List[str]
    generated_at: datetime

