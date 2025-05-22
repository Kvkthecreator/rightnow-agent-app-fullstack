## codex/tasks/1_task-M3-b_prompt-tool-note.md

# M-3 (b) — Prompt builder appends “tool note” to system prompt

## Context
Agents benefit from knowing which external tools they may call.
We prepend a one-liner to the existing `prompt_template`.

## Changes
```diff
* api/src/app/agent_tasks/middleware/prompt_builder.py

*** 🔧 Patch ***
@@
-from core.task_registry import get_task_type
+from core.task_registry import get_task_type
 
 def build_prompt(task_type_id: str, payload: dict) -> str:
-    task = get_task_type(task_type_id)
-    template = task.prompt_template
+    task = get_task_type(task_type_id)
+
+    # ------------------------------------------------------------------
+    # NEW: prepend tool-availability sentence if tools are present
+    # ------------------------------------------------------------------
+    if task.tools:
+        tool_note = (
+            "You have access to the following external tools during reasoning: "
+            + ", ".join(task.tools)
+            + ".\n\n"
+        )
+    else:
+        tool_note = ""
+
+    template = tool_note + task.prompt_template
 
     # very simple {{var}} replacement
     for k, v in payload.items():
         template = template.replace(f"{{{{{k}}}}}", str(v))
     return template


---

### ✅ After both tasks run

```python
from core.task_registry import get_task_type
from app.tools import get_tool_clients

t = get_task_type("analyze_competitors")
print(t.tools)                # → ['mcp', 'web_search']
print(get_tool_clients(t.tools))  # → list with MCP stub + WebSearch stub

