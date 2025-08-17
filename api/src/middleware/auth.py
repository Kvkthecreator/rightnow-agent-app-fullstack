"""FastAPI middleware to enforce JWT authentication."""

from __future__ import annotations

import os
from collections.abc import Iterable

import jwt
from api.src.auth.jwt_verifier import verify_jwt
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


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

        DBG = request.headers.get("x-yarnnn-debug-auth") == "1"
        try:
            claims = verify_jwt(token)
            request.state.user_id = claims.get("sub")
            request.state.jwt_payload = claims
            request.state.user = {
                "sub": claims.get("sub"),
                "aud": claims.get("aud"),
                "iss": claims.get("iss"),
            }
            request.app.logger.info(
                {
                    "event": "jwt_ok",
                    "alg": alg,
                    "iss": claims.get("iss"),
                    "aud": claims.get("aud"),
                }
            )
            resp: Response = await call_next(request)
            if DBG:
                resp.headers["X-Auth-Alg"] = alg
                resp.headers["X-Auth-Iss"] = claims.get("iss", "")
                resp.headers["X-Auth-Aud"] = str(claims.get("aud", ""))
            return resp
        except Exception as e:  # noqa: BLE001
            def _clean(v: str | None) -> str:
                return (v or "").strip().rstrip("/")

            expected_iss = _clean(os.getenv("SUPABASE_JWKS_ISSUER")) or f"{_clean(os.getenv('SUPABASE_URL'))}/auth/v1"
            expected_aud = (os.getenv("SUPABASE_JWT_AUD") or "authenticated").strip()
            request.app.logger.warning(
                {
                    "event": "jwt_verify_failed",
                    "alg": alg,
                    "expected_iss": expected_iss,
                    "expected_aud": expected_aud,
                    "error": e.__class__.__name__,
                }
            )
            if DBG:
                return Response(
                    content='{"detail":"Invalid authentication token"}',
                    status_code=401,
                    media_type="application/json",
                    headers={
                        "X-Auth-Error": e.__class__.__name__,
                        "X-Auth-Alg": alg,
                        "X-Auth-Expect-Iss": expected_iss,
                        "X-Auth-Expect-Aud": expected_aud,
                    },
                )
            raise HTTPException(status_code=401, detail="Invalid authentication token")


__all__ = ["AuthMiddleware"]

