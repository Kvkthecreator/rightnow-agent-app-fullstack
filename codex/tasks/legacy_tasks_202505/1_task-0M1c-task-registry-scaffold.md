## codex/tasks/1_task-0M1c-task-registry-scaffold.md

# M-1 (c) — Scaffold Task-Registry package

## Context
Creates `core/task_registry` with Pydantic models, file provider, and
seed JSON.  Nothing here overwrites existing files.

## Changes
```diff
+ api/src/core/task_registry/__init__.py
+ api/src/core/task_registry/models.py
+ api/src/core/task_registry/providers/__init__.py
+ api/src/core/task_registry/providers/file.py
+ api/src/core/task_registry/seed/task_types.json

*** ✨ models.py***
from pydantic import BaseModel
from typing import List, Literal, Optional

class InputField(BaseModel):
    name: str
    label: str
    type: Literal["string", "url", "markdown", "number", "list"]

class TaskType(BaseModel):
    id: str
    title: str
    description: str
    agent_type: Literal["strategy", "content", "repurpose", "feedback"]
    input_fields: List[InputField]
    prompt_template: str
    output_type: str
    tools: List[str] = []
    validator_schema: Optional[str] = None
    enabled: bool = True
    version: str = "1"


*** ✨ providers/__init__.py*** 
def get_provider():
    from .file import FileProvider
    return FileProvider()


*** ✨ providers/file.py***
from pathlib import Path
import json
from ..models import TaskType

SEED_PATH = Path(__file__).parents[2] / "seed" / "task_types.json"

class FileProvider:
    def __init__(self, path: Path = SEED_PATH):
        self.path = path
        self._cache = None

    def _load(self):
        if self._cache is None:
            with open(self.path) as f:
                raw = json.load(f)
            self._cache = [TaskType(**t) for t in raw]
        return self._cache

    def list(self):
        return self._load()

    def get(self, task_id: str):
        return next((t for t in self._load() if t.id == task_id), None)


*** ✨ __init__.py (registry façade)***
from .providers import get_provider
provider = get_provider()

def list_task_types():
    return provider.list()

def get_task_type(task_id: str):
    return provider.get(task_id)


*** ✨ seed/task_types.json ***
[
  {
    "id": "analyze_competitors",
    "title": "Analyze My Competitors",
    "description": "Compare up to 5 competitor handles and find differentiation opportunities.",
    "agent_type": "strategy",
    "input_fields": [
      { "name": "competitor_urls", "label": "Competitor URLs", "type": "list" }
    ],
    "prompt_template": "You are a brand strategist. Analyse {{competitor_urls}} …",
    "output_type": "CompetitorTable",
    "tools": ["mcp", "web_search"],
    "enabled": true,
    "version": "1"
  }
]



