from app.agent_tasks.layer1_infra.schemas import RefreshReport

from .base import BaseSchema


class ResearchIn(BaseSchema):
    pass


class ResearchOut(RefreshReport, BaseSchema):
    pass
