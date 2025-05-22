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
from fastapi.middleware.cors import CORSMiddleware

# Routers from agent_tasks
from .agent_tasks.profilebuilder_task import router as profilebuilder_router
from .agent_tasks.profile_analyzer_task import router as profile_analyzer_router
from .agent_tasks.manager_task import router as manager_router
# Report DB helpers and auth
from .db.reports import create_report, complete_report
from .util.auth_helpers import current_user_id
# Task routing for report-based tasks
from .agent_tasks.middleware.task_router import route_and_validate_task
# API routes for reports
from .routes.reports import router as reports_router

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
@app.post("/agent-run")
async def agent_run(payload: dict, user_id: str = Depends(current_user_id)):
    """
    Run a registered task, create a report, and return its ID.
    """
    # Extract task type and inputs
    task_type_id = payload.pop("task_type_id", None)
    if not task_type_id:
        raise HTTPException(status_code=422, detail="Missing 'task_type_id'")
    # Create initial report record
    report_id = create_report(user_id, task_type_id, payload)
    try:
        # Execute and validate the task
        result = await route_and_validate_task(task_type_id, {}, payload)
        # Prepare report output with expected shape: output_type and data
        report_data = {
            "output_type": result.get("output_type"),
            "data": result.get("validated_output"),
        }
        # Mark report as completed
        complete_report(report_id, report_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"report_id": report_id}
    
app.include_router(profilebuilder_router)
app.include_router(profile_analyzer_router)
app.include_router(manager_router)
# Mount report routes
app.include_router(reports_router)



