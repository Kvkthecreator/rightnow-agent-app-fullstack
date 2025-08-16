"""FastAPI middleware to enforce JWT authentication."""

from __future__ import annotations

import logging
from collections.abc import Iterable

from auth.jwt_verifier import verify_jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Validate Supabase JWTs on protected routes."""

    def __init__(self, app, exempt_paths: Iterable[str] | None = None) -> None:
        super().__init__(app)
        self.exempt_paths = set(exempt_paths or [])

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if any(request.url.path.startswith(p) for p in self.exempt_paths):
            return await call_next(request)

        token = request.headers.get("sb-access-token")
        if not token:
            auth = request.headers.get("Authorization")
            if auth and auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1]

        if not token:
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Missing authentication token",
                    }
                },
            )

        try:
            payload = verify_jwt(token)
        except Exception:  # noqa: BLE001
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid authentication token",
                    }
                },
            )

        logger.info(
            "JWT verified iss=%s aud=%s sub=%s",
            payload.get("iss"),
            payload.get("aud"),
            payload.get("sub"),
        )
        request.state.user_id = payload.get("sub")
        request.state.jwt_payload = payload
        return await call_next(request)


__all__ = ["AuthMiddleware"]

