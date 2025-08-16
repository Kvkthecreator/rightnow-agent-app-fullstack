"""Supabase JWT verification supporting HS256 and RS256."""

from __future__ import annotations

import os

import jwt
from jwt import PyJWKClient

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
ISSUER = os.getenv("SUPABASE_JWKS_ISSUER", f"{SUPABASE_URL}/auth/v1")
AUD = os.getenv("SUPABASE_JWT_AUD", "authenticated")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWKS_URL = os.getenv("SUPABASE_JWKS_URL", f"{SUPABASE_URL}/auth/v1/keys")
LEEWAY = int(os.getenv("JWT_CLOCK_SKEW", "60"))

_jwk = PyJWKClient(JWKS_URL) if JWKS_URL else None
_opts = {"verify_exp": True, "require": ["exp", "iat", "iss", "aud", "sub"]}


def verify_jwt(token: str) -> dict:
    """Verify a Supabase JWT and return its payload."""
    alg = (jwt.get_unverified_header(token).get("alg") or "").upper()
    if alg == "HS256":
        if not JWT_SECRET:
            raise RuntimeError("SUPABASE_JWT_SECRET missing for HS256 verification")
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            audience=AUD,
            issuer=ISSUER,
            options=_opts,
            leeway=LEEWAY,
        )
    if alg == "RS256":
        if not _jwk:
            raise RuntimeError("JWKS unavailable for RS256 verification")
        key = _jwk.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=AUD,
            issuer=ISSUER,
            options=_opts,
            leeway=LEEWAY,
        )
    raise jwt.InvalidAlgorithmError(f"Unsupported JWT alg: {alg}")


__all__ = ["verify_jwt"]

