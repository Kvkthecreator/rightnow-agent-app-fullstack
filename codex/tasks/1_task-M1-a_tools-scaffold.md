## codex/tasks/1_task-M1-a_tools-scaffold.md

📄 task-M1-a_tools-scaffold.md

# M-1 (a) — Scaffold tools package

## Context
We introduce a generic Tool interface and a registry helpers module
under `api/src/app/tools/`.  
Agents will import `from app.tools import get_tool_clients`.

## Changes
```diff
+ api/src/app/tools/__init__.py
+ api/src/app/tools/base.py
✨ tools/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict

class Tool(ABC):
    slug: str  # e.g. "mcp" or "web_search"

    @abstractmethod
    async def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Execute the tool.  Return structured JSON."""
✨ tools/__init__.py
"""
Tool registry & factory helpers
"""
from typing import List
from .base import Tool
from importlib import import_module

# Mapping slug -> module path (initially only MCP; others added later)
_TOOL_MODULES = {
    "mcp":  ".mcp",
    "web_search": ".web_search",
    "image_gen": ".image_gen",
}

def _load(slug: str) -> Tool:
    module_path = _TOOL_MODULES[slug]
    mod = import_module(__name__ + module_path)
    return mod.Client()  # all tool modules expose Client subclassing Tool

def get_tool_clients(slugs: List[str]) -> List[Tool]:
    return [_load(s) for s in slugs]

---

## 📄 **task-M1-b_mcp-tool.md**

```md
# M-1 (b) — Add MCP connector tool

## Context
First concrete external tool connector; dummy implementation
prints a log for now.

## Changes
```diff
+ api/src/app/tools/mcp.py
✨ tools/mcp.py
import aiohttp
from typing import Any, Dict
from .base import Tool

MCP_BASE_URL = "https://your-mcp-server.example.com"

class Client(Tool):
    slug = "mcp"

    async def run(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the MCP server.  For now, a stub that echoes payload.
        """
        # Replace with real call when MCP is available.
        # Example:
        # async with aiohttp.ClientSession() as session:
        #     async with session.post(f"{MCP_BASE_URL}/{endpoint}", json=payload) as r:
        #         r.raise_for_status()
        #         return await r.json()
        return {
            "status": "stub",
            "endpoint": endpoint,
            "echo": payload,
        }

---

### ✅ What happens next?
* Agents can now request tool instances:

```python
from app.tools import get_tool_clients
tool_clients = get_tool_clients(task.tools)  # task.tools is ["mcp"] etc.