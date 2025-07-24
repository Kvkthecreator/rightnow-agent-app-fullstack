from app.memory.blocks.schemas import AuditReport

from .base import BaseSchema


class AuditIn(BaseSchema):
    pass


class AuditOut(AuditReport, BaseSchema):
    pass
