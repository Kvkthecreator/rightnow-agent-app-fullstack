## codex/tasks/2_task-3-reportsPATCH-use_apiGet_everywhere.md

# TaskForm now posts through Next.js rewrite

## Changes
```diff
* web/components/TaskForm.tsx

*** 🔧 Patch ***
-    const res = await fetch("/api/agent-run", {
+    const res = await fetch("/api/agent-run", {
