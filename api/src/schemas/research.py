from app.memory.blocks.schemas import RefreshReport

from .base import BaseSchema


class ResearchIn(BaseSchema):
    pass


class ResearchOut(RefreshReport, BaseSchema):
    pass
