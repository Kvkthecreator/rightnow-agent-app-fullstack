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

# Task Brief and task-type routes are disabled for Phase 1
# Agent handlers
from .agent_entrypoints import router as agent_router, run_agent, run_agent_direct
from .routes.agent_run import router as agent_run_router
from .routes.agents import router as agents_router
from .routes.basket_new import router as basket_new_router
from .routes.basket_snapshot import router as snapshot_router

# Route modules
from .routes.baskets import router as basket_router
from .routes.blocks import router as blocks_router
from .routes.change_queue import router as change_queue_router
from .routes.commits import router as commits_router
from .routes.debug import router as debug_router
from .routes.dump_new import router as dump_new_router
from .routes.inputs import router as inputs_router
from .routes.phase1_routes import router as phase1_router

# ── Environment variable for Bubble webhook URL
CHAT_URL = os.getenv("BUBBLE_CHAT_URL")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(title="RightNow Agent Server")

routers = (
    dump_new_router,
    commits_router,
    blocks_router,
    change_queue_router,
    basket_router,
    basket_new_router,
    snapshot_router,
    inputs_router,
    debug_router,
    agent_router,
    agent_run_router,
    agents_router,
    phase1_router,
)

for r in routers:
    app.include_router(r, prefix="/api")

# Agent entrypoints with API prefix


@app.post("/api/agent")
async def api_run_agent(request):
    return await run_agent(request)


@app.post("/api/agent/direct")
async def api_run_agent_direct(request):
    return await run_agent_direct(request)

# Logger for instrumentation
logger = logging.getLogger("uvicorn.error")
if "SUPABASE_SERVICE_ROLE_KEY" not in os.environ:
    logger.warning("SUPABASE_SERVICE_ROLE_KEY not set; Supabase operations may fail")


@app.get("/", include_in_schema=False)
async def health():  # pragma: no cover
    return {"status": "ok"}


# Allow CORS from any origin (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yarnnn.com",
        "https://www.yarnnn.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
