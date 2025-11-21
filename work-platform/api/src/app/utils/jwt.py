"""Minimal Supabase JWT verification helper."""

from __future__ import annotations

from fastapi import HTTPException, Request


def verify_jwt(request: Request) -> dict[str, str]:
    """Return the caller's user ID and raw JWT token, set by :class:`AuthMiddleware`."""

    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    # Extract raw JWT token from Authorization header for pass-through to substrate-API
    auth_header = request.headers.get("authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.lower().startswith("bearer ") else None

    return {
        "user_id": str(user_id),
        "token": token or "",  # Raw JWT for substrate-API authentication
    }

