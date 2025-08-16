"""FastAPI middleware to enforce JWT authentication."""

from __future__ import annotations

import logging
import os
from collections.abc import Iterable

import jwt
from auth.jwt_verifier import verify_jwt
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


def _extract_token(req: Request) -> str | None:
    auth = req.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return req.headers.get("sb-access-token")


class AuthMiddleware(BaseHTTPMiddleware):
    """Validate Supabase JWTs on protected routes."""

    def __init__(self, app, exempt_paths: Iterable[str] | None = None) -> None:
        super().__init__(app)
        self.exempt_paths = set(exempt_paths or [])

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if any(request.url.path.startswith(p) for p in self.exempt_paths):
            return await call_next(request)

        token = _extract_token(request)
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
            alg = (jwt.get_unverified_header(token).get("alg") or "").upper()
        except Exception:
            alg = "UNKNOWN"

        try:
            payload = verify_jwt(token)
            request.state.user_id = payload.get("sub")
            request.state.jwt_payload = payload
            request.state.user = {
                "sub": payload.get("sub"),
                "aud": payload.get("aud"),
                "iss": payload.get("iss"),
            }
            logger.info(
                {
                    "event": "jwt_ok",
                    "alg": alg,
                    "iss": payload.get("iss"),
                    "aud": payload.get("aud"),
                }
            )
            response: Response = await call_next(request)
            response.headers["X-Auth-Alg"] = alg
            response.headers["X-Auth-Iss"] = payload.get("iss", "")
            response.headers["X-Auth-Aud"] = str(payload.get("aud", ""))
            return response
        except Exception as e:  # noqa: BLE001
            logger.warning(
                {
                    "event": "jwt_verify_failed",
                    "alg": alg,
                    "expected_iss": os.getenv("SUPABASE_JWKS_ISSUER")
                    or f"{os.getenv('SUPABASE_URL')}/auth/v1",
                    "expected_aud": os.getenv("SUPABASE_JWT_AUD")
                    or "authenticated",
                    "error": e.__class__.__name__,
                }
            )
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid authentication token",
                    }
                },
            )


__all__ = ["AuthMiddleware"]

