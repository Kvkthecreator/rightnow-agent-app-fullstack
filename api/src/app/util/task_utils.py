# /api/src/app/utils/task_utils.py

import uuid
import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def create_task_and_session(user_id: str, agent_type: str, metadata: dict = {}) -> str:
    """
    Generates a task_id, logs a new agent_session, and returns the task_id.
    Reusable across all agent types.
    """
    task_id = str(uuid.uuid4())

    payload = {
        "id": task_id,
        "user_id": user_id,
        "agent_type": agent_type,
        **metadata,
    }

    # Debug: log payload for insertion
    print("📝 create_task_and_session payload:", payload)
    # Insert new session row
    response = supabase.table("agent_sessions").insert(payload).execute()
    # Debug: log full Supabase response
    try:
        code = getattr(response, 'status_code', None)
        data = getattr(response, 'data', None)
        error = getattr(response, 'error', None)
    except Exception as _e:
        print("⚠️ create_task_and_session: Could not unpack response fields", _e)
        code, data, error = None, None, None
    print(f"🔍 create_task_and_session response: status_code={code}, data={data}, error={error}")

    # Check for insertion errors
    if error or code != 201:
        # Build informative message
        msg = f"Agent session creation failed (status={code})"
        if error:
            msg += f": {error.message if hasattr(error, 'message') else error}"
        print("❌", msg)
        raise Exception(msg)

    return task_id
