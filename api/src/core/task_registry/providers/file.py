# api/src/core/task_registry/providers/file.py

"""File-based provider loading task types from JSON seed."""
import json
import logging
from pathlib import Path
from typing import List, Optional

from ..models import TaskType
from ._base import TaskTypeProvider  # adjust import if your base class lives elsewhere

class FileProvider(TaskTypeProvider):
    """
    Loads TaskType definitions from a JSON seed file.
    Caches after first load; returns an empty list if the file is missing.
    """

    def __init__(self, path: Optional[Path] = None):
        # Compute seed path relative to this file, unless overridden
        if path is None:
            here = Path(__file__).resolve().parent
            path = here.parent.parent / "seed" / "task_types.json"
        self.path: Path = path
        self._cache: Optional[List[TaskType]] = None

    def _load(self) -> List[TaskType]:
        # If already cached, return it
        if self._cache is not None:
            return self._cache

        try:
            raw = json.loads(self.path.read_text(encoding="utf-8") or "[]")
        except FileNotFoundError:
            logging.warning("Task types seed file not found at %s", self.path)
            raw = []
        except json.JSONDecodeError as e:
            logging.error("Invalid JSON in task types seed file %s: %s", self.path, e)
            raw = []

        # Parse into Pydantic models
        items: List[TaskType] = []
        for entry in raw:
            try:
                items.append(TaskType(**entry))
            except Exception as e:
                logging.error("Invalid TaskType entry %r in %s: %s", entry, self.path, e)

        self._cache = items
        return items

    def list(self) -> List[TaskType]:
        """Return all TaskType instances."""
        return self._load()

    def get(self, task_id: str) -> Optional[TaskType]:
        """Fetch a single TaskType by its `id`."""
        return next((t for t in self._load() if t.id == task_id), None)
