"""API route for listing available task types."""
from fastapi import APIRouter
from core.task_registry import list_task_types

router = APIRouter(prefix="/task-types", tags=["task-types"])


@router.get("/", response_model=list[dict])
async def list_all():
    """Return all registered TaskTypes."""
    return [t.model_dump() for t in list_task_types()]