from typing import Any, Literal

from .db import json_safe
from app.utils.supabase_client import supabase_client as supabase


async def log_event(
    *,
    basket_id: str | None,
    agent: str,
    phase: Literal["start", "success", "error"],
    payload: Any,
) -> None:
    # fast, fire-and-forget; no await on the returned promise
    supabase.table("agent_events").insert(
        json_safe(
            {
                "basket_id": basket_id,
                "agent": agent,
                "phase": phase,
                "payload": payload,
            }
        )
    ).execute()
