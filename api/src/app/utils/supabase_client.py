"""Local Supabase client used by application routes and tasks."""

import logging
import os

import jwt

from supabase import create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase env vars missing")


def _decode_key_role(key: str) -> str:
    try:
        decoded = jwt.decode(key, options={"verify_signature": False})
    except Exception:  # noqa: BLE001
        return "UNKNOWN"
    return decoded.get("role", "UNKNOWN")


supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

SUPABASE_KEY_ROLE = _decode_key_role(SUPABASE_SERVICE_ROLE_KEY)
logger.info("[SUPABASE DEBUG] Loaded Supabase key role: %s", SUPABASE_KEY_ROLE)
if SUPABASE_KEY_ROLE != "service_role":
    logger.error(
        "[SUPABASE ERROR] Invalid key role loaded: %s. This may cause permission errors.",
        SUPABASE_KEY_ROLE,
    )

__all__ = ["supabase_client", "_decode_key_role", "SUPABASE_KEY_ROLE"]
