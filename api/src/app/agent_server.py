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

from agents import Runner

# Specialist and Manager agent definitions (moved to agent_tasks)
from .agent_tasks.specialist_agents import strategy, content, repurpose, feedback
from .agent_tasks.manager_task import manager, AGENTS, build_payload, flatten_payload

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(profilebuilder_router)

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
