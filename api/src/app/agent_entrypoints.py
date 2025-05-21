"""
agent_entrypoints.py

Entrypoint implementations for agent_server endpoints.
"""
from fastapi import Request, HTTPException
import json

from agents import Runner
from .agent_tasks.manager_task import manager, AGENTS, build_payload, flatten_payload
from .util.task_utils import create_task_and_session
from .util.webhook import send_webhook

async def run_agent(req: Request):
    data    = await req.json()
    # normalize prompt
    prompt = (
        data.get("prompt") or data.get("user_prompt") or data.get("message")
    )
    if not prompt:
        raise HTTPException(422, "Missing 'prompt' field")

    # mandatory IDs (generate new session if missing)
    task_id = data.get("task_id")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    if not task_id:
        task_id = create_task_and_session(user_id, "manager")

    # 1) Run Manager with error catch for handoff parsing issues
    try:
        result = await Runner.run(
            manager,
            input=prompt,
            context={"task_id": task_id, "user_id": user_id},
            max_turns=12,
        )
    except json.JSONDecodeError:
        # Handoff JSON malformed: send fallback clarification
        fallback = build_payload(
            task_id=task_id,
            user_id=user_id,
            agent_type="manager",
            message={"type":"text","content":
                     "Sorry, I couldn’t process your request—could you rephrase?"},
            reason="handoff_parse_error",
            trace=[]
        )
        await send_webhook(flatten_payload(fallback))
        print("RETURNING FROM run_agent (handoff_parse_error path):", {"ok": True})
        return {"ok": True}

    # 2) Final output comes from the last agent in the chain
    raw = result.final_output.strip()
    print(f"Raw LLM output: {raw}")
    try:
        json.loads(raw)
        reason = "Agent returned structured JSON"
    except Exception:
        reason = "Agent returned unstructured output"
    trace = result.to_debug_dict() if hasattr(result, 'to_debug_dict') else []

    # 3) Send the final specialist webhook
    final_type = (result.agent.name
                  if hasattr(result, "agent") and result.agent
                  else "manager")
    out_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type=final_type,
        message={"type":"text","content": raw},
        reason=reason,
        trace=trace
    )
    await send_webhook(flatten_payload(out_payload))

    print("RETURNING FROM run_agent (success path):", {"ok": True})
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