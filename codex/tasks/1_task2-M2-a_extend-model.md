## codex/tasks/1_task2-M2-a_extend-model.md

# M-2 (a) — Extend TaskType model with `tools` list

## Context
We need a `tools: List[str]` field so each task can declare which
external connectors (e.g., `"mcp"`, `"web_search"`) it requires.

## Changes
```diff
* api/src/core/task_registry/models.py

*** 🔧 Patch models.py ***

@@
 class TaskType(BaseModel):
@@
-    output_type: str
+    output_type: str
+    tools: list[str] = []       # ← NEW (default empty)
@@
     version: str = "1"
