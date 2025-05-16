# agents/agent_server.py — deterministic handoffs via SDK `handoff()` with robust error handling
#
# Deployment instructions:
#
# Local development:
#   cd api/src
#   uvicorn app.agent_server:app --host 0.0.0.0 --port 10000
#
# Render deployment options:
#   Option A: Set Working Directory to api/src
#     uvicorn app.agent_server:app --host 0.0.0.0 --port $PORT
#
#   Option B: Set Working Directory to api
#     uvicorn src.app.agent_server:app --host 0.0.0.0 --port $PORT

from __future__ import annotations
import os
import sys
import json
import urllib.request

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .profilebuilder_agent import profilebuilder_agent
from .profilebuilder import router as profilebuilder_router
from .util.task_utils import create_task_and_session
from .util.webhook import send_webhook as util_send_webhook
from .profile_analyzer_agent import profile_analyzer_agent

from agents.tool import WebSearchTool

# ── SDK setup ───────────────────────────────────────────────────────────────
from agents import Agent, Runner, handoff, RunContextWrapper
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")

# ── send_webhook helper ─────────────────────────────────────────────────────
async def send_webhook(payload: dict):
    # Synchronous HTTP POST using requests (no httpx available)
    try:
        print("=== Webhook Dispatch ===\n", json.dumps(payload, indent=2))
        # Send HTTP POST via urllib.request
        req = urllib.request.Request(
            CHAT_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req):
            pass
        print("========================")
    except Exception as e:
        print("Webhook error:", e)

# ── Specialist agents ──────────────────────────────────────────────────────
strategy  = Agent(
    name="strategy",
    instructions="You create 7-day social strategies. Respond ONLY in structured JSON."
)
content   = Agent(
    name="content",
    instructions="You write brand-aligned social posts. Respond ONLY in structured JSON."
)
repurpose = Agent(
    name="repurpose",
    instructions="You repurpose content. Respond ONLY in structured JSON."
)
feedback  = Agent(
    name="feedback",
    instructions="You critique content. Respond ONLY in structured JSON."
)
# Override inline `profile_analyzer` with the updated, tool-enabled agent
profile_analyzer = profile_analyzer_agent

AGENTS = {
    "strategy": strategy,
    "content": content,
    "repurpose": repurpose,
    "feedback": feedback,
    "profile_analyzer": profile_analyzer,
    "profilebuilder": profilebuilder_agent
}

# ── Pydantic model for Manager handoff payload ────────────────────────────
class HandoffData(BaseModel):
    clarify: str
    prompt: str

# ── Manager agent ──────────────────────────────────────────────────────────
MANAGER_TXT = """
You are the Manager. When routing, you MUST call exactly one of these tools:
  • transfer_to_strategy
  • transfer_to_content
  • transfer_to_repurpose
  • transfer_to_feedback

Each call must pass a JSON object matching this schema (HandoffData):
{
  "clarify": "<optional follow-up question or empty string>",
  "prompt":  "<the text to send next>"
}

Do NOT output any other JSON or wrap in Markdown. The SDK will handle the rest.
"""

async def on_handoff(ctx: RunContextWrapper[HandoffData], input_data: HandoffData):
    # Send manager clarification webhook
    task_id = ctx.context['task_id']
    user_id = ctx.context['user_id']
    payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={'type':'text','content': input_data.clarify},
        reason='handoff',
        trace=ctx.usage.to_debug_dict() if hasattr(ctx.usage, 'to_debug_dict') else []
    )
    await send_webhook(flatten_payload(payload))

manager = Agent(
    name="manager",
    instructions=prompt_with_handoff_instructions(MANAGER_TXT),
    handoffs=[
        handoff(agent=strategy,  on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=content,   on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=repurpose, on_handoff=on_handoff, input_type=HandoffData),
        handoff(agent=feedback,  on_handoff=on_handoff, input_type=HandoffData),
    ]
)

ALL_AGENTS = {"manager": manager, **AGENTS}

# ── Payload builders ─────────────────────────────────────────────────────────
def build_payload(task_id, user_id, agent_type, message, reason, trace):
    return {
        "task_id":    task_id,
        "user_id":    user_id,
        "agent_type": agent_type,
        "message":    {"type": message.get("type"), "content": message.get("content")},
        "metadata":   {"reason": reason},
        "trace":      trace,
        "created_at": datetime.utcnow().isoformat(),
    }

def flatten_payload(p: dict) -> dict:
    """
    Flatten one level of nested message/metadata for Bubble.
    """
    return {
        "task_id":         p["task_id"],
        "user_id":         p["user_id"],
        "agent_type":      p["agent_type"],
        "message_type":    p["message"]["type"],
        "message_content": p["message"]["content"],
        "metadata_reason": p["metadata"].get("reason", ""),
        "created_at":      p["created_at"],
    }

# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(profilebuilder_router)

# Include legacy agent endpoints
from .legacy_agent_router import router as legacy_agent_router
app.include_router(legacy_agent_router)

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
    except json.JSONDecodeError as e:
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

@app.post("/profile_analyzer")
async def profile_analyzer_endpoint(request: Request):
    # Parse and validate request body
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")
    task_id = body.get("task_id")
    user_id = body.get("user_id")
    profile = body.get("profile")
    if not task_id:
        raise HTTPException(422, "Missing 'task_id'")
    if not user_id:
        raise HTTPException(422, "Missing 'user_id'")
    if not profile or not isinstance(profile, dict):
        raise HTTPException(422, "Missing or invalid 'profile'")
    print(f"[/profile_analyzer] Received payload: {body}")
    # Generate insight report
    try:
        result = profile_analyzer_agent(profile)
    except Exception as e:
        print(f"[/profile_analyzer] Error running profile_analyzer_agent: {e}")
        raise HTTPException(500, "Error processing profile")
    print(f"[/profile_analyzer] Agent result: {result}")
    # Build webhook payload
    hook_payload = {
        "task_id": task_id,
        "user_id": user_id,
        "agent_type": "profileanalyzer",
        "message_type": "profile_report",
        "message_content": result,
        "created_at": datetime.utcnow().isoformat()
    }
    # POST report to new frontend endpoint instead of legacy Bubble webhook
    webhook_url = "https://rightnow-agent-app-fullstack.vercel.app/api/receive_report"
    # Send webhook
    try:
        await util_send_webhook(webhook_url, hook_payload)
    except Exception as e:
        print(f"[/profile_analyzer] Error sending webhook: {e}")
        raise HTTPException(500, "Error sending webhook")
    # Return the insight report
    return result
