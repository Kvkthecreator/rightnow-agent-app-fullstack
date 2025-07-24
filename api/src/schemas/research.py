# TODO: Define fields for RefreshReport appropriately.
from .base import BaseSchema
RefreshReport = BaseSchema


class ResearchIn(BaseSchema):
    pass


class ResearchOut(RefreshReport, BaseSchema):
    pass
