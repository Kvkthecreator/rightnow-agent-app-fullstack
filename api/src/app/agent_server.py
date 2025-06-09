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
# FastAPI and CORS imports
from fastapi import FastAPI, HTTPException, Depends
import logging
from fastapi.middleware.cors import CORSMiddleware


# Authentication helper and output normalization
from .agent_tasks.layer1_infra.utils.auth_helpers import current_user_id
from .agent_tasks.layer1_infra.utils.normalize_output import normalize_output
# Task routing for execution
from .agent_tasks.layer2_tasks.utils.task_router import route_and_validate_task
from .routes.task_types import router as task_types_router
from .routes.task_brief import router as task_brief_router
from .routes.baskets import router as basket_router
from .routes.agent_run import router as agent_run_router

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(debug=True)
# Logger for instrumentation
logger = logging.getLogger("uvicorn.error")
@app.get("/", include_in_schema=False)
async def root():  # pragma: no cover
    """Health-check endpoint."""
    return {"status": "ok"}

# Allow CORS from any origin (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace "*" with your front-end URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount agent entrypoint handlers
from .agent_entrypoints import router as agent_router, run_agent, run_agent_direct
app.post("/agent")(run_agent)
app.post("/agent/direct")(run_agent_direct)
app.include_router(agent_router)

# Mount task-types routes
app.include_router(task_types_router)
# Mount task-brief routes
app.include_router(task_brief_router)
# Mount basket routes
app.include_router(basket_router)
# Agent-run proxy route
app.include_router(agent_run_router)



