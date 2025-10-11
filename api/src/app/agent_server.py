# RightNow Agent Server entrypoint with robust error handling
# ruff: noqa: E402

from __future__ import annotations

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Extend sys.path so sibling packages resolve correctly
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(base_dir, "..")))
sys.path.append(base_dir)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Route imports
from middleware.auth import AuthMiddleware
from middleware.correlation import CorrelationIdMiddleware

from .agent_entrypoints import router as agent_router, run_agent, run_agent_direct
from .routes.reflections import router as reflections_router
from services.canonical_queue_processor import start_canonical_queue_processor, stop_canonical_queue_processor, get_canonical_queue_health
from .routes.agent_memory import router as agent_memory_router
from .routes.agent_run import router as agent_run_router
from .routes.agents import router as agents_router
from .routes.auth_health import router as auth_health_router
from .routes.basket_from_template import router as template_router
from .routes.basket_new import router as basket_new_router
from .routes.basket_snapshot import router as snapshot_router
from .routes.baskets import router as basket_router
from .routes.block_lifecycle import router as block_lifecycle_router
from .routes.blocks import router as blocks_router
from .routes.change_queue import router as change_queue_router
from .routes.commits import router as commits_router
from .routes.context_intelligence import router as context_intelligence_router
from .routes.context_items import router as context_items_router
from .routes.debug import router as debug_router
from .routes.dump_new import router as dump_new_router
from .routes.health import router as health_router
from .routes.inputs import router as inputs_router
from .routes.narrative_intelligence import router as narrative_intelligence_router
from .routes.narrative_jobs import router as narrative_jobs_router
from .routes.integration_tokens import router as integration_tokens_router
from .routes.auth_validate import router as auth_validate_router
from .routes.openai_apps import router as openai_apps_router
from .routes.mcp_inference import router as mcp_inference_router
from .routes.memory_unassigned import router as memory_unassigned_router
from .routes.mcp_activity import router as mcp_activity_router
from .routes.phase1_routes import router as phase1_router
from .routes.projection import router as projection_router
from .routes.work_status import router as work_status_router
from .routes.p4_composition import router as p4_composition_router
from .api.validator.validate_proposal import router as validator_router


def _assert_env():
    """Validate critical environment variables at startup."""
    missing = [k for k in ("SUPABASE_URL","SUPABASE_JWT_SECRET","SUPABASE_SERVICE_ROLE_KEY") if not os.getenv(k)]
    if missing:
        log = logging.getLogger("uvicorn.error")
        log.error("ENV MISSING: %s", ",".join(missing))
        raise RuntimeError(f"Missing env vars: {missing}")
    log = logging.getLogger("uvicorn.error")
    log.info("ENV OK: URL/JWT_SECRET/SERVICE_ROLE present")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger = logging.getLogger("uvicorn.error")
    logger.info("Starting RightNow Agent Server with Queue Processor")

    # Validate environment
    _assert_env()

    # Start canonical agent queue processor (Canon v2.1 compliant)
    await start_canonical_queue_processor()
    logger.info("Canonical agent queue processor started - Canon v2.1 ready")

    try:
        yield
    finally:
        # Clean shutdown
        await stop_canonical_queue_processor()
        logger.info("Canonical agent queue processor stopped")

app = FastAPI(title="RightNow Agent Server", lifespan=lifespan)

# Require JWT auth on API routes
app.add_middleware(
    AuthMiddleware,
    exempt_paths={"/", "/health", "/health/db", "/docs", "/openapi.json", "/favicon.ico", "/robots.txt", "/index.html", "/api/agents/p4-composition"},
    exempt_prefixes={"/health"},
)

# Include routers
routers = (
    dump_new_router,
    commits_router,
    blocks_router,
    change_queue_router,
    basket_new_router,
    snapshot_router,
    inputs_router,
    debug_router,
    agent_router,
    agent_run_router,
    agents_router,
    phase1_router,
    context_items_router,
    block_lifecycle_router,
    agent_memory_router,
    template_router,
    context_intelligence_router,
    narrative_intelligence_router,
    auth_health_router,
    health_router,
    work_status_router,
    p4_composition_router,
    validator_router,
    mcp_inference_router,
        memory_unassigned_router,
        mcp_activity_router,
    integration_tokens_router,
    auth_validate_router,
    openai_apps_router,
)

# Add correlation middleware
app.add_middleware(CorrelationIdMiddleware)

for r in routers:
    app.include_router(r, prefix="/api")

app.include_router(basket_router)
app.include_router(reflections_router)
app.include_router(narrative_jobs_router)
app.include_router(projection_router)

# Agent endpoints
@app.post("/api/agent")
async def api_run_agent(request):
    return await run_agent(request)

@app.post("/api/agent/direct")
async def api_run_agent_direct(request):
    return await run_agent_direct(request)

@app.get("/", include_in_schema=False)
async def health():
    return {"status": "ok"}

@app.get("/health/db", include_in_schema=False)
async def health_db():
    """Database health check for deployment verification"""
    try:
        from app.utils.supabase_client import supabase_client
        # Test Supabase connection with a simple query
        result = supabase_client.rpc('fn_queue_health').execute()
        return {
            "status": "healthy",
            "supabase_connected": True,
            "queue_health": result.data if result.data else "healthy"
        }
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        return {
            "status": "unhealthy", 
            "supabase_connected": False,
            "error": str(e)
        }

@app.get("/health/queue", include_in_schema=False)
async def health_queue():
    """Canonical agent queue health check"""
    return await get_canonical_queue_health()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.yarnnn.com",  # production
        "https://yarnnn.com",
        "http://localhost:3000",   # for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log missing Supabase anon key
logger = logging.getLogger("uvicorn.error")
if "SUPABASE_ANON_KEY" not in os.environ:
    logger.warning("SUPABASE_ANON_KEY not set; Supabase operations may fail")
