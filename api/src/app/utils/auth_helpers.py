"""Authentication helper utilities.

Provide dependencies for FastAPI routes using Supabase tokens.
"""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .supabase_client import get_supabase

bearer = HTTPBearer()


async def current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    """Decode Supabase JWT and return the user ID."""
    token = creds.credentials
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise KeyError
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token") from exc
    return user_id


async def get_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
):
    """Return the user object for the provided Supabase JWT."""
    token = creds.credentials
    supabase = get_supabase()
    try:
        user_response = supabase.auth.get_user(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token") from exc

    # `get_user` may return a dataclass with a `user` attribute or the user dict directly
    return getattr(user_response, "user", user_response)
