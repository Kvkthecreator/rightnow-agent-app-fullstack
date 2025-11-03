# Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Any, Optional, List, Dict

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


class AppEvent(BaseModel):
    """Standard event envelope for all notifications."""
    id: Optional[str] = None
    v: int = 1
    type: str  # job_update|system_alert|action_result|collab_activity|validation
    name: str
    phase: Optional[str] = None  # started|progress|succeeded|failed
    severity: str = "info"  # info|success|warning|error
    message: str
    correlation_id: Optional[str] = None
    scope: Optional[Dict[str, str]] = None
    dedupe_key: Optional[str] = None
    ttl_ms: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    

class ApiResponse(BaseModel):
    """Standard API response envelope with notifications support."""
    ok: bool = True
    data: Any = None
    notifications: Optional[List[AppEvent]] = None
    correlation_id: Optional[str] = None
    

class ApiError(BaseModel):
    """Standard error response."""
    ok: bool = False
    error: Dict[str, Any]
    notifications: Optional[List[AppEvent]] = None
    correlation_id: Optional[str] = None


class AcceptedResponse(BaseModel):
    """202 Accepted response for async operations."""
    ok: bool = True
    accepted: bool = True
    job_id: str
    message: str = "Processing started"
    correlation_id: Optional[str] = None
