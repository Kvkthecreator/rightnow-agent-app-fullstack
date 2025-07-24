import json
from datetime import datetime

from agents import Runner
from fastapi import APIRouter, HTTPException, Request
from src.utils.db import json_safe

from .agents.utils.supabase_helpers import (
    create_task_and_session,
    supabase,
)


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


AGENT_REGISTRY = {
    "manager": manager,
}


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
    data = await req.json()
    prompt = data.get("prompt") or data.get("user_prompt") or data.get("message")
    if not prompt:
        raise HTTPException(422, "Missing 'prompt' field")

    task_type_id = data.get("task_type_id")
    if not task_type_id:
        raise HTTPException(422, "Missing 'task_type_id'")
    task_id = data.get("task_id")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    collected_inputs = data.get("collected_inputs", {}) or {}

    if not task_id:
        task_id = create_task_and_session(
            user_id,
            "manager",
            metadata={
                "task_type_id": task_type_id,
                "inputs": collected_inputs,
                "status": "clarifying",
            },
        )

    try:
        supabase.table("agent_sessions").update(
            json_safe({"inputs": collected_inputs})
        ).eq("id", task_id).execute()
    except Exception:
        print(f"Warning: failed to persist inputs for task_id={task_id}")

    try:
        result = await Runner.run(
            manager,
            input=prompt,
            context={
                "task_id": task_id,
                "user_id": user_id,
                "task_type_id": task_type_id,
                "collected_inputs": collected_inputs,
            },
            max_turns=12,
        )
    except Exception:
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={
                "type": "text",
                "content": "Sorry, I couldn’t process your request—could you rephrase?",
            },
            reason="parse_error",
            trace=[],
        )
        log_agent_message(task_id, user_id, "manager", fallback["message"])
        return {"ok": True, "task_id": task_id}

    raw = result.final_output.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={
                "type": "text",
                "content": "Sorry, I couldn’t process your request—could you rephrase?",
            },
            reason="parse_error",
            trace=[],
        )
        log_agent_message(task_id, user_id, "manager", fallback["message"])
        return {"ok": True, "task_id": task_id}

    msg_type = parsed.get("type")

    if msg_type == "clarification":
        field = parsed.get("field")
        question = parsed.get("message")
        try:
            supabase.table("agent_sessions").update(
                json_safe({"inputs": collected_inputs, "pending_field": field})
            ).eq("id", task_id).execute()
        except Exception:
            print(f"[warn] Could not persist pending_field for task_id={task_id}")
        payload = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type": "text", "content": question},
            reason="clarification",
            trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
        )
        log_agent_message(task_id, user_id, "manager", payload["message"])
        return {"ok": True, "task_id": task_id}

    if msg_type == "structured":
        agent_type = parsed.get("agent_type") or "specialist"
        inputs = parsed.get("input", {})
        try:
            supabase.table("agent_sessions").update(
                json_safe({"status": "completed", "inputs": inputs})
            ).eq("id", task_id).execute()
        except Exception:
            print(f"Warning: failed to update session status for task_id={task_id}")

        payload = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type=agent_type,
            message={"type": "structured", "data": inputs},
            reason="completion",
            trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
        )
        log_agent_message(task_id, user_id, agent_type, payload["message"])
        return {"ok": True, "task_id": task_id}

    fallback_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "text", "content": raw},
        reason="unstructured",
        trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
    )
    log_agent_message(task_id, user_id, "manager", fallback_payload["message"])
    return {"ok": True, "task_id": task_id}


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
        task_id = create_task_and_session(user_id, agent.name)

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
