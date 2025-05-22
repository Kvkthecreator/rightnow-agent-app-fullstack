"""File-based provider loading task types from JSON seed"""
from pathlib import Path
import json
from ..models import TaskType

# Path to seed JSON file containing task type definitions
SEED_PATH = Path(__file__).parents[2] / "seed" / "task_types.json"

class FileProvider:
    def __init__(self, path: Path = SEED_PATH):
        self.path = path
        self._cache = None

    def _load(self):
        if self._cache is None:
            try:
                with open(self.path) as f:
                    raw = json.load(f)
            except FileNotFoundError:
                # No seed file; return empty list
                self._cache = []
            else:
                self._cache = [TaskType(**t) for t in (raw or [])]
        return self._cache

    def list(self):
        """Return list of all TaskType instances."""
        return self._load()

    def get(self, task_id: str):
        """Retrieve a TaskType by its ID, or None if not found."""
        return next((t for t in self._load() if t.id == task_id), None)