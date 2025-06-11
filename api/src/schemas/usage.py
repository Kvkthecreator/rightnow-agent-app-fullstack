from app.agent_tasks.layer1_infra.schemas import UsageReport

from .base import BaseSchema


class UsageIn(BaseSchema):
    pass


class UsageOut(UsageReport, BaseSchema):
    pass
