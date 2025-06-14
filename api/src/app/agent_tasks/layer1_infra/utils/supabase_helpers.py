import os

from supabase import create_client
from uuid import uuid4
from datetime import datetime
from src.utils.db import json_safe

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment; otherwise Supabase cannot be initialised."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_supabase() -> 'Client':
    """
    Return the initialized Supabase client.
    """
    return supabase

def get_collected_fields(user_id: str, task_id: str) -> dict:
    """
    Retrieves all profile_partial fields collected so far for a given user and task.
    Searches the Supabase table that stores agent messages (e.g., 'agent_messages').

    Returns a dictionary like:
    {
        "niche": "English teacher",
        "audience_goal": "Teens beginner level",
        ...
    }
    """
    collected = {}

    try:
        response = supabase.table("agent_messages") \
            .select("message_type, message_content") \
            .eq("user_id", user_id) \
            .eq("task_id", task_id) \
            .eq("agent_type", "profilebuilder") \
            .eq("message_type", "profile_partial") \
            .execute()

        for item in response.data:
            content = item.get("message_content", {})
            if isinstance(content, dict):
                collected.update(content)

    except Exception as e:
        print(f"[Supabase error] Failed to fetch collected fields: {e}")

    return collected


def create_task_and_session(user_id: str, agent_type: str, metadata: dict | None = None) -> str:
    """Insert a new row into ``agent_sessions`` and return the task_id."""
    task_id = str(uuid4())
    payload = {
        "id": task_id,
        "user_id": user_id,
        "agent_type": agent_type,
        "metadata": metadata or {},
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        supabase.table("agent_sessions").insert(json_safe(payload)).execute()
    except Exception as e:  # pragma: no cover - best effort logging only
        print(f"[warn] Failed to create agent_session: {e}")
    return task_id
