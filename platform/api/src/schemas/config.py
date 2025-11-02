from uuid import UUID

from .base import BaseSchema


class ConfigIn(BaseSchema):
    brief_id: UUID
    user_id: str


class ConfigOut(BaseSchema):
    brief_id: UUID
    user_id: str
    intent: str
    core_context: dict
    blocks: list[dict]
    config: dict
