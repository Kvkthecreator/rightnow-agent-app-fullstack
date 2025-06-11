from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class BaseSchema(BaseModel):
    model_config = {
        "extra": "forbid",
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v),
        },
    }

    @classmethod
    def model_validate(cls, obj):  # type: ignore[override]
        if hasattr(super(), "model_validate"):
            return super().model_validate(obj)  # type: ignore[attr-defined]
        return cls.parse_obj(obj)
