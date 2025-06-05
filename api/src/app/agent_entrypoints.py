import json
from datetime import datetime

from agents import Runner
from fastapi import APIRouter, HTTPException, Request

from .agent_tasks.holding.competitor_agent import competitor_agent as competitor
from .agent_tasks.holding.content_agent import content
from .agent_tasks.holding.feedback_agent import feedback
from .agent_tasks.holding.profile_analyzer_agent import profile_analyzer_agent as profile_analyzer
from .agent_tasks.holding.repurpose_agent import repurpose
from .agent_tasks.holding.strategy_agent import strategy
from .agent_tasks.layer1_infra.agents.infra_manager_agent import manager
from .agent_tasks.layer1_infra.utils.supabase_helpers import supabase
from .agent_tasks.layer2_tasks.agents.tasks_composer_agent import run as compose_run
from .agent_tasks.layer2_tasks.agents.tasks_editor_agent import edit as editor_run
from .agent_tasks.layer2_tasks.agents.tasks_validator_agent import validate as validate_run
from .agent_tasks.layer2_tasks.registry import get_missing_fields

# 0603 for layer2 agents (above fastapi, Depends import as well)
from .agent_tasks.layer2_tasks.schemas import ComposeRequest
from .agent_tasks.layer2_tasks.utils.output_utils import build_payload
from .agent_tasks.layer2_tasks.utils.task_router import route_and_validate_task
from .agent_tasks.layer2_tasks.utils.task_utils import create_task_and_session

router = APIRouter()


@router.post("/brief/compose")
async def compose_brief(req: ComposeRequest):
    # 1 Compose
    draft = await compose_run(req)

    # 2 Editor (pass-through v0)
    edited = await editor_run(draft)

    # 3 Validator
    report = await validate_run(edited)
    if not report.ok:
        raise HTTPException(status_code=400, detail=report.errors)

    return {"brief_id": draft.brief_id, "validated": True}


# 0603 for layer2 agents (above fastapi, Depends import as well)

AGENT_REGISTRY = {
    "strategy": strategy,
    "content": content,
    "feedback": feedback,
    "repurpose": repurpose,
    "profile_analyzer": profile_analyzer,
    "competitor": competitor,
}


def log_agent_message(task_id, user_id, agent_type, message):
    try:
        supabase.table("agent_messages").insert(
            {
                "task_id": task_id,
                "user_id": user_id,
                "agent_type": agent_type,
                "message_type": message.get("type", "text"),
                "message_content": message,
                "created_at": datetime.utcnow().isoformat(),
            }
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

    missing_fields = get_missing_fields(task_type_id, collected_inputs)
    try:
        supabase.table("agent_sessions").update({"inputs": collected_inputs}).eq(
            "id", task_id
        ).execute()
    except Exception:
        print(f"Warning: failed to persist inputs for task_id={task_id}")

    status_payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={
            "type": "system",
            "content": {
                "provided_fields": list(collected_inputs.keys()),
                "missing_fields": missing_fields,
            },
        },
        reason="input_status",
        trace=[],
    )
    log_agent_message(task_id, user_id, "manager", status_payload["message"])

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
                {"inputs": collected_inputs, "pending_field": field}
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
        agent_type = parsed.get("agent_type")
        inputs = parsed.get("input", {})
        try:
            supabase.table("agent_sessions").update({"status": "dispatched", "inputs": inputs}).eq(
                "id", task_id
            ).execute()
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
        log_agent_message(task_id, user_id, agent_type, final_payload["message"])
        try:
            supabase.table("agent_sessions").update({"status": "completed"}).eq(
                "id", task_id
            ).execute()
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
    context = {"task_id": task_id, "user_id": user_id, "profile_data": data.get("profile_data")}

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
