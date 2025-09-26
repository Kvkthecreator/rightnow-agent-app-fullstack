from __future__ import annotations

import os, sys, logging
from collections.abc import Iterable

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from auth.jwt_verifier import verify_jwt  # your verifier

log = logging.getLogger("uvicorn.error")


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        exempt_paths: Iterable[str] | None = None,
        exempt_prefixes: Iterable[str] | None = None,
    ):
        super().__init__(app)
        self.exempt_exact = set(exempt_paths or [])
        # Only *true* prefixes belong here; NEVER include "/"
        self.exempt_prefixes = set(exempt_prefixes or [])

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        path = request.url.path or "/"
        dbg = request.headers.get("x-yarnnn-debug-auth") == "1"

        # Exact first
        if path in self.exempt_exact:
            return await call_next(request)
        # Then prefixes (no "/")
        if any(path.startswith(p) for p in self.exempt_prefixes):
            return await call_next(request)

        # Extract token
        auth = request.headers.get("authorization") or ""
        token = auth.split(" ", 1)[1] if auth.lower().startswith("bearer ") else None
        if not token:
            if not dbg:
                log.debug("AuthMiddleware: missing bearer token for %s", path)
            return JSONResponse(status_code=401, content={"error": "missing_token"})

        # Verify (return rich detail in debug mode)
        try:
            claims = verify_jwt(token)
            # Attach to request for handlers
            request.state.user_id = claims.get("sub")
            request.state.jwt_payload = claims
            return await call_next(request)
        except HTTPException as e:
            if not dbg:
                log.debug(
                    "AuthMiddleware: token verification failed for %s (%s)",
                    path,
                    e.detail,
                )
                return JSONResponse(
                    status_code=e.status_code,
                    content={"error": "invalid_token"},
                )
            # Verifier will have logged details; expose a concise failure reason
            return JSONResponse(
                status_code=e.status_code,
                content={"error": "invalid_token", "detail": e.detail},
            )


__all__ = ["AuthMiddleware"]
