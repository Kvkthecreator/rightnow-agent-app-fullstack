## codex/tasks/1_task2b-M2-b_seed-tools.md

# M-2 (b) — Add `tools` field to seed task_types.json

## Context
Only the `analyze_competitors` task is active; declare it uses MCP+
web search.

## Changes
```diff
* api/src/core/task_registry/seed/task_types.json

🔧 Patch (first task object only)

@@
     "output_type": "CompetitorTable",
+    "tools": ["mcp", "web_search"],
     "enabled": true,
     "version": "1"
   }


> **Note**: leave the remaining 9 task stubs untouched for now; they’ll
> gain `tools` later as we flesh them out.

---

### ✅ After running both tasks

1. **Import check**  
   ```bash
   python - <<'PY'
   from core.task_registry import get_task_type
   print(get_task_type("analyze_competitors").tools)
   PY
   # → ['mcp', 'web_search']


