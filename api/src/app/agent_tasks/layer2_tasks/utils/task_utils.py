# /api/src/app/util/task_utils.py

import os
import uuid

from src.utils.db import json_safe

from supabase import Client, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def create_task_and_session(user_id: str, agent_type: str, metadata: dict | None = None) -> str:
    """
    Generates a task_id, logs a new agent_session, and returns the task_id.
    Reusable across all agent types.
    """
    task_id = str(uuid.uuid4())

    payload = {
        "id": task_id,
        "user_id": user_id,
        "agent_type": agent_type,
        **(metadata or {}),
    }

    # Log payload before sending
    print("📝 create_task_and_session payload:", payload)

    # Insert session row
    response = supabase.table("agent_sessions").insert(json_safe(payload)).execute()

    # Log response (flexibly handle missing fields)
    try:
        code = getattr(response, "status_code", None)
        data = getattr(response, "data", None)
        error = getattr(response, "error", None)
    except Exception as _e:
        print("⚠️ create_task_and_session: Could not unpack response fields", _e)
        code, data, error = None, None, None

    print(f"🔍 create_task_and_session response: status_code={code}, data={data}, error={error}")

    # New check: only fail if data is missing or error exists
    if not data:
        msg = "Agent session creation failed: no data returned"
        if error:
            msg += f" — Supabase error: {error.message if hasattr(error, 'message') else error}"
        print("❌", msg)
        raise Exception(msg)

    # Success
    session_id = data[0]["id"]
    print("✅ Created agent_session:", session_id)
    return session_id
