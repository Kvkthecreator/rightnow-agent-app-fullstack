"""
agent_entrypoints.py

Entrypoint implementations for agent_server endpoints.
"""
from fastapi import Request, HTTPException
import json

from agents import Runner
from .agent_tasks.manager_agent import manager, AGENTS
from .agent_tasks.middleware.task_router import route_and_validate_task
from .agent_tasks.middleware.output_utils import build_payload, flatten_payload
from .util.task_utils import create_task_and_session
from .util.webhook import send_webhook

async def run_agent(req: Request):
    data = await req.json()
    # normalize prompt
    prompt = data.get("prompt") or data.get("user_prompt") or data.get("message")
    if not prompt:
        raise HTTPException(422, "Missing 'prompt' field")

    # Extract required identifiers
    task_type_id = data.get("task_type_id")
    if not task_type_id:
        raise HTTPException(422, "Missing 'task_type_id'")
    task_id = data.get("task_id")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    if not task_id:
        task_id = create_task_and_session(user_id, "manager")

    # Extract collected inputs for iterative flow
    collected_inputs = data.get("collected_inputs", {}) or {}
    # Track missing vs provided fields and persist inputs
    from .agent_tasks.registry import get_missing_fields
    from .util.supabase_helpers import supabase
    # Determine which fields still missing
    missing_fields = get_missing_fields(task_type_id, collected_inputs)
    # Persist current inputs state to Supabase
    try:
        supabase.table("agent_sessions").update({"inputs": collected_inputs}).eq("id", task_id).execute()
    except Exception:
        # Log but don't fail the flow
        print(f"Warning: failed to persist inputs for task_id={task_id}")
    # Send system message with input status
    status_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "system", "content": {"provided_fields": list(collected_inputs.keys()), "missing_fields": missing_fields}},
        reason="input_status",
        trace=[],
    )
    await send_webhook(flatten_payload(status_payload))

    # 1) Run Manager agent to decide next action
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
        # Parsing or runner error: ask user to rephrase
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type": "text", "content":
                     "Sorry, I couldn’t process your request—could you rephrase?"},
            reason="parse_error",
            trace=[],
        )
        await send_webhook(flatten_payload(fallback))
        return {"ok": True}

    raw = result.final_output.strip()
    # 2) Parse manager output
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Malformed JSON: ask user to rephrase
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type": "text", "content":
                     "Sorry, I couldn’t process your request—could you rephrase?"},
            reason="parse_error",
            trace=[],
        )
        await send_webhook(flatten_payload(fallback))
        return {"ok": True}

    msg_type = parsed.get("type")
    # 3a) Clarification requested
    if msg_type == "clarification":
        field = parsed.get("field")
        question = parsed.get("message")
        payload = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type": "text", "content": question},
            reason="clarification",
            trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
        )
        await send_webhook(flatten_payload(payload))
        return {"ok": True}

    # 3b) All inputs gathered: dispatch to specialist
    if msg_type == "structured":
        agent_type = parsed.get("agent_type")
        inputs = parsed.get("input", {})
        # Route to specialist via existing router and validate output
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
        await send_webhook(flatten_payload(final_payload))
        return {"ok": True}

    # 3c) Fallback: send raw text
    fallback_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "text", "content": raw},
        reason="unstructured",
        trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
    )
    await send_webhook(flatten_payload(fallback_payload))
    return {"ok": True}

async def run_agent_direct(req: Request):
    data = await req.json()

    agent_type = data.get("agent_type")
    agent = AGENTS.get(agent_type)
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
    await send_webhook(flatten_payload(payload))
    return {"ok": True}