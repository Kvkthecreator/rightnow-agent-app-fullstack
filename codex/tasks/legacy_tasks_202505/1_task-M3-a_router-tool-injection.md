## codex/tasks/1_task-M3-a_router-tool-injection.md

# M-3 (a) — Inject tool clients in task_router.py

## Context
`TaskType.tools` now lists connector slugs (e.g., `["mcp","web_search"]`).
We modify `task_router.py` to:

1. Fetch that list from the registry.
2. Call `get_tool_clients(slugs)` from `app.tools`.
3. Pass the resulting list into the agent constructor (keyword `tools`).

For now we only wire the four first-party agents; if a given agent
doesn’t yet accept a `tools` kwarg this is harmless (Python ignores
unexpected kwargs when **kwargs is present).

## Changes
```diff
* api/src/app/agent_tasks/middleware/task_router.py

*** 🔧 Patch ***
@@
-from core.task_registry import get_task_type
+from core.task_registry import get_task_type
+from app.tools import get_tool_clients

@@
-    task_def = get_task_type(task_type_id)
-    agent_type = task_def.agent_type
+    task_def = get_task_type(task_type_id)
+    agent_type = task_def.agent_type
+
+    # ------------------------------------------------------------------
+    # NEW: build list[Tool] for this task
+    # ------------------------------------------------------------------
+    tool_clients = get_tool_clients(task_def.tools)
+
@@
-    if agent_type == "strategy":
-        agent = StrategyAgent()
+    if agent_type == "strategy":
+        agent = StrategyAgent(tools=tool_clients)
     elif agent_type == "content":
-        agent = ContentAgent()
+        agent = ContentAgent(tools=tool_clients)
     elif agent_type == "repurpose":
-        agent = RepurposeAgent()
+        agent = RepurposeAgent(tools=tool_clients)
     elif agent_type == "feedback":
-        agent = FeedbackAgent()
+        agent = FeedbackAgent(tools=tool_clients)
     else:
         raise ValueError(f"Unknown agent_type: {agent_type}")

