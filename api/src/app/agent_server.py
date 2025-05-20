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
import traceback

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
from .profile_analyzer_agent import ProfileAnalyzerInput
from .agent_tasks.context import get_full_profile_context

from agents.tool import WebSearchTool

# ── SDK setup ───────────────────────────────────────────────────────────────
from agents import Agent, Runner, handoff, RunContextWrapper
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")

# ── send_webhook helper ─────────────────────────────────────────────────────
async def send_webhook(payload: dict):
    # Debug: show webhook payload before dispatch
    print("SENDING WEBHOOK:", payload)
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

from .agent_entrypoints import run_agent, run_agent_direct



@app.post("/agent")
async def agent_endpoint(request: Request):
    """
    Universal agent entrypoint for frontend testing and integration.

    Accepts JSON payload:
        {
            "prompt": "<prompt string>",
            "user_id": "<user identifier>",
            "task_id": "<task identifier>"  # optional
        }

    Returns:
        {"ok": True} on success, or HTTPException on error.
    """
    # Invoke core agent logic and debug return value
    result = await run_agent(request)
    print("RETURNING FROM /agent:", result)
    return result


@app.post("/profile_analyzer")
async def profile_analyzer_endpoint(payload: ProfileAnalyzerInput):
    """
    Accepts a profile analysis request and returns the structured insights from the Profile Analyzer agent.
    """
    # Load full profile context (profile row + report sections) from DB
    full_context = get_full_profile_context(payload.user_id)
    profile_data = full_context.get("profile", {})
    # Prepare profile data as a single text block for agent input
    profile_text = "\n".join([f"{key}: {value}" for key, value in profile_data.items()])
    # Optionally include prior report sections in the prompt
    if full_context.get("report_sections"):
        profile_text += "\n\nPrevious Report Sections:\n"
        for sec in full_context["report_sections"]:
            profile_text += f"- {sec.get('title')}: {sec.get('body')}\n"
    input_message = {
        "role": "user",
        "content": [
            {
                "type": "input_text",
                "text": profile_text
            }
        ]
    }
    # Run the Profile Analyzer agent asynchronously with message list format
    try:
        # Build agent invocation context bundle
        agent_context = {
            "task_id": payload.task_id,
            "user_id": payload.user_id,
            "profile": profile_data,
            "report_sections": full_context.get("report_sections", []),
        }
        result = await Runner.run(
            profile_analyzer_agent,
            input=[input_message],
            context=agent_context,
            max_turns=12,
        )
    except Exception as e:
        print("=== PROFILE_ANALYZER EXCEPTION ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing profile: {e}")
    # Return structured output from the agent (already a Python dict)
    return result.final_output
