"""Supabase JWT verification using JWKS with caching."""

from __future__ import annotations

import json
import os
import time

import jwt
import requests
from jwt import InvalidTokenError

# JWKS caching
_JWKS_CACHE: dict[str, dict] = {}
_JWKS_LAST_FETCH: float = 0
_JWKS_TTL = 60 * 5  # 5 minutes


def _jwks_url() -> str:
    jwks_url = os.getenv("SUPABASE_JWKS_URL")
    if jwks_url:
        return jwks_url
    base_url = os.getenv("SUPABASE_URL")
    if not base_url:
        raise RuntimeError("SUPABASE_JWKS_URL or SUPABASE_URL not configured")
    return f"{base_url.rstrip('/')}/auth/v1/keys"


def _expected_issuer() -> str:
    issuer = os.getenv("SUPABASE_JWKS_ISSUER") or os.getenv("SUPABASE_JWT_ISS")
    if issuer:
        return issuer
    base_url = os.getenv("SUPABASE_URL")
    if not base_url:
        raise RuntimeError("SUPABASE_JWKS_ISSUER or SUPABASE_URL not configured")
    return f"{base_url.rstrip('/')}/auth/v1"


def _expected_audience() -> str:
    return os.getenv("SUPABASE_JWT_AUD", "authenticated")


def _fetch_jwks(force: bool = False) -> dict[str, dict]:
    """Fetch JWKS and cache results."""
    global _JWKS_CACHE, _JWKS_LAST_FETCH
    now = time.time()
    if force or now - _JWKS_LAST_FETCH > _JWKS_TTL or not _JWKS_CACHE:
        resp = requests.get(_jwks_url(), timeout=5)
        resp.raise_for_status()
        data = resp.json()
        _JWKS_CACHE = {jwk["kid"]: jwk for jwk in data.get("keys", [])}
        _JWKS_LAST_FETCH = now
    return _JWKS_CACHE


def _get_key(kid: str):
    jwks = _fetch_jwks()
    if kid not in jwks:
        jwks = _fetch_jwks(force=True)
    jwk = jwks.get(kid)
    if not jwk:
        raise InvalidTokenError("Unknown key id")
    return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))


def verify_jwt(token: str) -> dict:
    """Verify a Supabase JWT and return its payload."""
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise InvalidTokenError("Missing kid")
    key = _get_key(kid)
    return jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        issuer=_expected_issuer(),
        audience=_expected_audience(),
    )


__all__ = ["verify_jwt"]

