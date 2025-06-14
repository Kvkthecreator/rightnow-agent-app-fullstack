"""Local Supabase client used by application routes and tasks."""

import os

from supabase import create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase env vars missing")

supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

__all__ = ["supabase_client"]
