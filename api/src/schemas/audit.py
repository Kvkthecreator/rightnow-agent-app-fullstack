from app.agent_tasks.layer1_infra.schemas import AuditReport

from .base import BaseSchema


class AuditIn(BaseSchema):
    pass


class AuditOut(AuditReport, BaseSchema):
    pass
