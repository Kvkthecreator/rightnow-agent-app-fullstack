# api/src/core/task_registry/providers/file.py

"""File-based provider loading task types from JSON seed."""
from pathlib import Path
import json
from typing import List, Optional

from ..models import TaskType

# Path to seed JSON file containing task type definitions
# Seed files are located in core/seed
SEED_PATH = Path(__file__).parents[2] / "seed" / "task_types.json"

class FileProvider:
    """
    Loads TaskType definitions from a JSON seed file.
    Caches after first load; returns an empty list if the file is missing
    or contains invalid JSON.
    """

    def __init__(self, path: Optional[Path] = None):
        self.path: Path = path or SEED_PATH
        self._cache: Optional[List[TaskType]] = None

    def _load(self) -> List[TaskType]:
        # Return cached if already loaded
        if self._cache is not None:
            return self._cache

        try:
            raw = json.loads(self.path.read_text(encoding="utf-8") or "[]")
        except FileNotFoundError:
            raw = []
        except json.JSONDecodeError:
            raw = []

        items: List[TaskType] = []
        for entry in raw:
            try:
                items.append(TaskType(**entry))
            except Exception:
                # skip invalid entries
                continue

        self._cache = items
        return items

    def list(self) -> List[TaskType]:
        """Return list of all TaskType instances."""
        return self._load()

    def get(self, task_id: str) -> Optional[TaskType]:
        """Retrieve a TaskType by its ID, or None if not found."""
        return next((t for t in self._load() if t.id == task_id), None)
