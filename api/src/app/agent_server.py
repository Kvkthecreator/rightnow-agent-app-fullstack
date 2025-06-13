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

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass
# FastAPI and CORS imports
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ingestion.job_listener import start_background_worker

# Route modules
from .routes.agent_run import router as agent_run_router
from .routes.baskets import router as basket_router
from .routes.blocks import router as blocks_router
from .routes.change_queue import router as change_queue_router
from .routes.commits import router as commits_router
from .routes.debug import router as debug_router
from .routes.dump import router as dump_router
from .routes.task_brief import router as task_brief_router

# Task routing for execution
from .routes.task_types import router as task_types_router

# Agent handlers
from .agent_entrypoints import router as agent_router, run_agent, run_agent_direct

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(title="RightNow Agent Server")
start_background_worker()

# ── Unified API mounting ────────────────────────────────────────────────
api = FastAPI()

# Route group under /api
api.include_router(agent_run_router, prefix="/api")
api.include_router(dump_router, prefix="/api")
api.include_router(commits_router, prefix="/api")
api.include_router(blocks_router, prefix="/api")
api.include_router(change_queue_router, prefix="/api")
api.include_router(task_types_router, prefix="/api")
api.include_router(task_brief_router, prefix="/api")
api.include_router(basket_router, prefix="/api")
api.include_router(debug_router, prefix="/api")
api.include_router(agent_router, prefix="/api")

# Agent entrypoints with API prefix

@api.post("/api/agent")
async def api_run_agent(request):
    return await run_agent(request)

@api.post("/api/agent/direct")
async def api_run_agent_direct(request):
    return await run_agent_direct(request)

# Mount the grouped API to root
app.mount("", api)

# Logger for instrumentation
logger = logging.getLogger("uvicorn.error")


@app.get("/", include_in_schema=False)
async def root():  # pragma: no cover
    return {"status": "ok"}


# Allow CORS from any origin (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
