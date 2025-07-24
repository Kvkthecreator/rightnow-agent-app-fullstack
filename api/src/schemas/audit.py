# TODO: Define fields for AuditReport appropriately.
from .base import BaseSchema
AuditReport = BaseSchema


class AuditIn(BaseSchema):
    pass


class AuditOut(AuditReport, BaseSchema):
    pass
