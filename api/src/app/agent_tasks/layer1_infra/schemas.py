"""Pydantic models for Layer-1 infrastructure agents."""

from pydantic import BaseModel
from typing import List
from datetime import datetime

class DuplicateLabel(BaseModel):
    label: str
    block_ids: List[str]

class AuditReport(BaseModel):
    ok: bool
    duplicate_labels: List[DuplicateLabel]
    generated_at: str  # ISO ts

class UsageReport(BaseModel):
    stale_ids: List[str]
    unused_ids: List[str]
    generated_at: datetime

class RefreshReport(BaseModel):
    refreshed_ids: List[str]
    proposed_ids: List[str]
    generated_at: datetime

