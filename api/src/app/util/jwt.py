"""Lightweight JWT helper used by FastAPI routes until we wire full auth."""
from typing import Dict, Any


def get_current_user(headers: Dict[str, str]) -> Dict[str, Any]:
    """Extract user/workspace IDs from 'sb-access-token' header if present.

    Returns {"user_id": str | None, "workspace_id": str | None}
    without raising if the header is missing – routes will 401 later.
    """
    token = headers.get("sb-access-token")  # FastAPI sets .headers
    if not token:
        return {"user_id": None, "workspace_id": None}
    # 🔒  In prod you’d verify JWT here (omitted for brevity).
    # For now just return dummy so boot succeeds.
    return {"user_id": "stub-user", "workspace_id": "stub-ws"}


__all__ = ["get_current_user"]
