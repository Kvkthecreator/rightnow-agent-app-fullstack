"""
agent_entrypoints.py

Entrypoint implementations for agent_server endpoints.
"""
from fastapi import Request, HTTPException
import json

from agents import Runner
# Orchestrator for manager flows
from .agent_tasks.manager_agent import manager
"""Specialist agents registry"""
from .agent_tasks.strategy_agent import strategy
from .agent_tasks.content_agent import content
from .agent_tasks.feedback_agent import feedback
from .agent_tasks.repurpose_agent import repurpose
# Profile Analyzer agent exports as profile_analyzer_agent
from .agent_tasks.profile_analyzer_agent import profile_analyzer_agent as profile_analyzer
# Competitor agent exports as competitor_agent
from .agent_tasks.competitor_agent import competitor_agent as competitor

AGENT_REGISTRY = {
    "strategy": strategy,
    "content": content,
    "feedback": feedback,
    "repurpose": repurpose,
    "profile_analyzer": profile_analyzer,
    "competitor": competitor,
}

from .agent_tasks.middleware.task_router import route_and_validate_task
from .agent_tasks.middleware.output_utils import build_payload, flatten_payload
from .util.task_utils import create_task_and_session
from .util.webhook import send_webhook

# Webhook targets
from .constants import CLARIFICATION_WEBHOOK_URL, STRUCTURED_WEBHOOK_URL

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

    from .agent_tasks.registry import get_missing_fields
    from .util.supabase_helpers import supabase

    missing_fields = get_missing_fields(task_type_id, collected_inputs)
    try:
        supabase.table("agent_sessions").update({"inputs": collected_inputs}).eq("id", task_id).execute()
    except Exception:
        print(f"Warning: failed to persist inputs for task_id={task_id}")

    status_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "system", "content": {"provided_fields": list(collected_inputs.keys()), "missing_fields": missing_fields}},
        reason="input_status",
        trace=[],
    )
    await send_webhook(CLARIFICATION_WEBHOOK_URL, flatten_payload(status_payload))

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
            message={"type": "text", "content": "Sorry, I couldn’t process your request—could you rephrase?"},
            reason="parse_error",
            trace=[],
        )
        await send_webhook(CLARIFICATION_WEBHOOK_URL, flatten_payload(fallback))
        return {"ok": True, "task_id": task_id}

    raw = result.final_output.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type": "text", "content": "Sorry, I couldn’t process your request—could you rephrase?"},
            reason="parse_error",
            trace=[],
        )
        await send_webhook(CLARIFICATION_WEBHOOK_URL, flatten_payload(fallback))
        return {"ok": True}

    msg_type = parsed.get("type")

    if msg_type == "clarification":
        field = parsed.get("field")
        question = parsed.get("message")
        try:
            supabase.table("agent_sessions").update({
                "inputs": collected_inputs,
                "pending_field": field
            }).eq("id", task_id).execute()
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
        await send_webhook(CLARIFICATION_WEBHOOK_URL, flatten_payload(payload))
        return {"ok": True}

    if msg_type == "structured":
        agent_type = parsed.get("agent_type")
        inputs = parsed.get("input", {})
        try:
            supabase.table("agent_sessions").update({"status": "dispatched", "inputs": inputs}).eq("id", task_id).execute()
        except Exception:
            print(f"Warning: failed to update session status to dispatched for task_id={task_id}")

        spec_result = await route_and_validate_task(
            task_type_id, {"task_id": task_id, "user_id": user_id}, inputs
        )
        output_type = spec_result.get("output_type")
        validated_data = spec_result.get("validated_output")
        final_payload = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type=agent_type,
            message={"type": "structured", "output_type": output_type, "data": validated_data},
            reason="completion",
            trace=spec_result.get("trace", []),
        )
        await send_webhook(STRUCTURED_WEBHOOK_URL, flatten_payload(final_payload))
        try:
            supabase.table("agent_sessions").update({"status": "completed"}).eq("id", task_id).execute()
        except Exception:
            print(f"Warning: failed to update session status to completed for task_id={task_id}")
        return {"ok": True, "task_id": task_id}

    fallback_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "text", "content": raw},
        reason="unstructured",
        trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
    )
    await send_webhook(CLARIFICATION_WEBHOOK_URL, flatten_payload(fallback_payload))
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
        "profile_data": data.get("profile_data")
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

    payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type=agent.name,
        message=msg,
        reason=reason,
        trace=trace
    )
    await send_webhook(STRUCTURED_WEBHOOK_URL, flatten_payload(payload))
    return {"ok": True}
