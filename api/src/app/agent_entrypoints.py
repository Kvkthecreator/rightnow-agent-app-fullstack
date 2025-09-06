import json
from datetime import datetime

from agents import Runner
from fastapi import APIRouter, HTTPException, Request

from src.utils.db import json_safe

# Legacy supabase helpers removed - use app.utils.supabase_client directly
from .utils.supabase_client import supabase_admin_client as supabase


# Phase 1 stubs
def build_payload(
    *,
    task_id: str,
    user_id: str,
    agent_type: str,
    message: dict,
    reason: str,
    trace: list,
) -> dict:
    """Simplified payload helper retained for logging."""
    return {
        "task_id": task_id,
        "user_id": user_id,
        "agent_type": agent_type,
        "message": message,
        "reason": reason,
        "trace": trace,
    }


router = APIRouter()

# Known agents mapped by name. Empty until agents are implemented.
AGENT_REGISTRY: dict[str, object] = {}


def log_agent_message(task_id, user_id, agent_type, message):
    try:
        supabase.table("agent_messages").insert(
            json_safe(
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "agent_type": agent_type,
                    "message_type": message.get("type", "text"),
                    "message_content": message,
                    "created_at": datetime.utcnow().isoformat(),
                }
            )
        ).execute()
    except Exception as e:
        print(f"[warn] Failed to log message to agent_messages: {e}")


async def run_agent(req: Request):
    """Placeholder implementation retained for compatibility."""
    raise HTTPException(501, "Manager agent not implemented")


async def run_agent_direct(req: Request):
    data = await req.json()

    agent_type = data.get("agent_type")
    agent = AGENT_REGISTRY.get(agent_type)
    if not agent:
        raise HTTPException(422, f"Unknown agent_type: {agent_type}")

    task_id = data.get("task_id")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    if not task_id:
        # Legacy task creation removed - use canonical agents directly
        task_id = f"canonical-{agent.name}-{user_id[:8]}"

    prompt = data.get("prompt") or data.get("message") or ""
    context = {
        "task_id": task_id,
        "user_id": user_id,
        "profile_data": data.get("profile_data"),
    }

    result = await Runner.run(agent, input=prompt, context=context, max_turns=12)
    raw = result.final_output.strip()

    try:
        content = json.loads(raw)
        reason = "Agent returned structured JSON"
        msg = {"type": "structured", "content": content}
    except json.JSONDecodeError:
        reason = "Agent returned unstructured output"
        msg = {"type": "text", "content": raw}

    trace = result.to_debug_dict() if hasattr(result, "to_debug_dict") else []
    payload = build_payload(  # noqa: F841
        task_id=task_id,
        user_id=user_id,
        agent_type=agent.name,
        message=msg,
        reason=reason,
        trace=trace,
    )
    log_agent_message(task_id, user_id, agent.name, msg)
    return {"ok": True, "task_id": task_id}
