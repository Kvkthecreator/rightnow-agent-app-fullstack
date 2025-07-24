from app.memory.blocks.schemas import UsageReport

from .base import BaseSchema


class UsageIn(BaseSchema):
    pass


class UsageOut(UsageReport, BaseSchema):
    pass
