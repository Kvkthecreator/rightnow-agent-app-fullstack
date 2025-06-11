from .base import BaseSchema


class BlockManagerIn(BaseSchema):
    pass


class BlockManagerOut(BaseSchema):
    status: str
