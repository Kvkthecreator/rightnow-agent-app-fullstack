"""Supabase JWT verification supporting HS256 and RS256."""
from __future__ import annotations
import os
import jwt
from jwt import PyJWKClient

def clean_url(v: str | None) -> str:
    return (v or "").strip().rstrip("/")

BASE = clean_url(os.getenv("SUPABASE_URL"))
if not BASE:
    raise RuntimeError("SUPABASE_URL is not set; cannot verify Supabase JWTs")

ISSUER = clean_url(os.getenv("SUPABASE_JWKS_ISSUER")) or f"{BASE}/auth/v1"
JWKS_URL = clean_url(os.getenv("SUPABASE_JWKS_URL"))  # Don't default to bad URL
AUD = (os.getenv("SUPABASE_JWT_AUD") or "authenticated").strip()
LEEWAY = int(os.getenv("JWT_CLOCK_SKEW", "60"))
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# DEBUG - Remove after fixing
print(f"JWT VERIFIER INIT:")
print(f"  BASE: {BASE}")
print(f"  ISSUER: {ISSUER}")
print(f"  AUD: {AUD}")
print(f"  JWT_SECRET exists: {bool(JWT_SECRET)}")
print(f"  JWT_SECRET length: {len(JWT_SECRET) if JWT_SECRET else 0}")
print(f"  JWT_SECRET first 10: {JWT_SECRET[:10] if JWT_SECRET else 'None'}...")

_jwk = PyJWKClient(JWKS_URL) if JWKS_URL else None
_opts = {"verify_exp": True, "require": ["exp", "iat", "iss", "aud", "sub"]}

def verify_jwt(token: str) -> dict:
    """Verify a Supabase JWT and return its payload."""
    header = jwt.get_unverified_header(token)
    alg = (header.get("alg") or "").upper()
    
    # DEBUG
    payload_unverified = jwt.decode(token, options={"verify_signature": False})
    print(f"VERIFY JWT DEBUG:")
    print(f"  Algorithm: {alg}")
    print(f"  Token ISS: {payload_unverified.get('iss')}")
    print(f"  Token AUD: {payload_unverified.get('aud')}")
    print(f"  Expected ISS: {ISSUER}")
    print(f"  Expected AUD: {AUD}")
    
    if alg == "HS256":
        if not JWT_SECRET:
            raise RuntimeError("SUPABASE_JWT_SECRET missing for HS256 verification")
        
        try:
            result = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                audience=AUD,
                issuer=ISSUER,
                options=_opts,
                leeway=LEEWAY,
            )
            print("  ✅ JWT verification successful!")
            return result
        except Exception as e:
            print(f"  ❌ JWT verification failed: {e}")
            raise
    
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