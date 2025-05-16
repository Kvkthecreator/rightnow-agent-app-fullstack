from fastapi import APIRouter

# Import legacy agent handlers
from .agent_entrypoints import run_agent, run_agent_direct

router = APIRouter()

# Register legacy agent endpoints
router.add_api_route(
    path="/agent",
    endpoint=run_agent,
    methods=["POST"],
)
router.add_api_route(
    path="/agent_direct",
    endpoint=run_agent_direct,
    methods=["POST"],
)