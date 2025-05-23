"""
Module: agent_tasks.registry

Central registry for TaskType definitions.
Loads the core seed JSON file once at import time and parses entries into Pydantic models.
"""
import json
from pathlib import Path
from core.task_registry.models import TaskType

# Path to the JSON seed file in core/seed
_FILE = Path(__file__).parents[2] / "core" / "seed" / "task_types.json"

# Load and parse TaskType entries at import time
try:
    _raw = json.loads(_FILE.read_text(encoding="utf-8") or "[]")
except Exception:
    _raw = []

_TASK_TYPES: list[TaskType] = []
for entry in _raw:
    try:
        _TASK_TYPES.append(TaskType(**entry))
    except Exception:
        # skip invalid entries
        continue

def get_all_task_types() -> list[TaskType]:  # noqa: E305
    """Return list of all TaskType models."""
    return _TASK_TYPES

def get_task_def(task_id: str) -> TaskType | None:  # noqa: E305
    """Retrieve a TaskType by ID, or None if not found."""
    return next((t for t in _TASK_TYPES if t.id == task_id), None)