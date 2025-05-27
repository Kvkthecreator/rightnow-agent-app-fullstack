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

# Routers from agent_tasks
from .agent_tasks.profilebuilder_task import router as profilebuilder_router
from .agent_tasks.profile_analyzer_task import router as profile_analyzer_router
from .agent_tasks.manager_task import router as manager_router
# Authentication helper and output normalization
from .util.auth_helpers import current_user_id
from .util.normalize_output import normalize_output
# Task routing for execution
from .agent_tasks.middleware.task_router import route_and_validate_task
from .routes.task_types import router as task_types_router

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
@app.post("/agent-run")
async def agent_run(
    payload: dict,
    user_id: str = Depends(current_user_id),
):
    """
    Run a registered task and return its output.
    """
    # Instrumentation: log incoming payload and resolved user
    logger.info("▶▶ [agent-run] got payload: %r", payload)
    logger.info("▶▶ [agent-run] resolved user_id: %r", user_id)
    # breakpoint()  # uncomment to trigger debugger
    try:
        # Extract task type and inputs
        task_type_id = payload.pop("task_type_id", None)
        if not task_type_id:
            raise HTTPException(status_code=422, detail="Missing 'task_type_id'")
        # Execute and validate the task
        result = await route_and_validate_task(task_type_id, {}, payload)
        # Return the normalized result directly
        return {
            "output_type": result.get("output_type"),
            "data": normalize_output(result.get("validated_output")),
        }
    except HTTPException:
        # re-raise client errors (e.g. missing task_type_id)
        raise
    except Exception as exc:
        # Log full exception stack trace
        logger.exception("‼️ Exception in /agent-run")
        # Return exception type and message to client
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}")
    
app.include_router(profilebuilder_router)
app.include_router(profile_analyzer_router)
app.include_router(manager_router)
# Mount task-types routes
app.include_router(task_types_router)



