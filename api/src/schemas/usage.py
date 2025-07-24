from datetime import datetime
from typing import List

from .base import BaseSchema


class UsageReport(BaseSchema):
    stale_ids: List[str]
    unused_ids: List[str]
    generated_at: datetime


class UsageIn(BaseSchema):
    pass


class UsageOut(UsageReport, BaseSchema):
    pass
