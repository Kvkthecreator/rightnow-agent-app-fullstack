"""API route for listing available task types."""
from fastapi import APIRouter
from ..agent_tasks.layer2_tasks.registry import get_all_task_types


router = APIRouter(prefix="/task-types", tags=["task-types"])


@router.get("/", response_model=list[dict])
async def list_all():
    """Return all registered TaskTypes."""
    return [t.model_dump() for t in get_all_task_types()]