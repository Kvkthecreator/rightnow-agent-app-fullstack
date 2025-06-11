from os import getenv
from typing import Any, Literal

from supabase import create_client

supabase = create_client(getenv("SUPABASE_URL"), getenv("SUPABASE_ANON_KEY"))

async def log_event(
    *,
    basket_id: str | None,
    agent: str,
    phase: Literal["start", "success", "error"],
    payload: Any,
) -> None:
    # fast, fire-and-forget; no await on the returned promise
    supabase.table("agent_events").insert(
        {
            "basket_id": basket_id,
            "agent": agent,
            "phase": phase,
            "payload": payload,
        }
    ).execute()

