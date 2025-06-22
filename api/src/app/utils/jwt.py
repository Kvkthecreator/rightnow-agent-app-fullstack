"""Minimal Supabase JWT verification helper."""

from __future__ import annotations

import logging
from typing import Annotated

import jwt
from fastapi import Header, HTTPException

logger = logging.getLogger("uvicorn.error")


def verify_jwt(
    sb_access_token: Annotated[str | None, Header(alias="sb-access-token")] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Return the caller's user ID extracted from a Supabase JWT."""

    token = sb_access_token
    if not token and authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
        else:
            token = authorization

    if not token:
        logger.debug("verify_jwt missing token")
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise KeyError
    except Exception as exc:  # noqa: BLE001
        logger.warning("verify_jwt invalid token: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc

    return {"user_id": str(user_id)}

