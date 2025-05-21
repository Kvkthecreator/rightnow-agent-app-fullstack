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
from .agent_tasks.profilebuilder_task import router as profilebuilder_router
from .util.task_utils import create_task_and_session
from .util.webhook import send_webhook as util_send_webhook
# Profile Analyzer logic moved to agent_tasks/profile_analyzer_task.py
from .agent_tasks.profile_analyzer_task import router as profile_analyzer_router
from .agent_tasks.context import get_full_profile_context

from agents import Runner

# Specialist and Manager agent definitions (moved to agent_tasks)
from .agent_tasks.strategy_agent import strategy
from .agent_tasks.content_agent import content
from .agent_tasks.repurpose_agent import repurpose
from .agent_tasks.feedback_agent import feedback
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
app.include_router(profile_analyzer_router)
from .agent_tasks.manager_task import router as manager_router
app.include_router(manager_router)



