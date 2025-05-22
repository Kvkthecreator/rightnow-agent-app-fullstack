"""API route for listing available task types."""
from fastapi import APIRouter
from core.task_registry import list_task_types

router = APIRouter(prefix="/task-types", tags=["task-types"])


@router.get("/")
def read_task_types():
    """
    Return all registered task types as plain JSON.
    """
    return [t.dict() for t in list_task_types()]