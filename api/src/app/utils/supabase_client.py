"""Supabase client factory that builds a per-request client using user JWT."""

from __future__ import annotations

import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("Supabase env vars missing")


def get_supabase(token: str) -> Client:
    """Create a new Supabase client scoped to the provided JWT."""
    client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    return client


supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


__all__ = ["get_supabase", "supabase_client"]
