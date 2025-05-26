## codex/tasks/repo_cleanup_agent_tasks.md

Codex Task: Agent Tasks Directory Cleanup & Import Check

Objective:
Ensure there is only one canonical agent_tasks module in the backend (/api/src/app/agent_tasks/). Remove any duplicate, outdated, or misplaced folders/files. Fix imports everywhere if needed.

Instructions for Codex or Dev
Check for duplicate or stray agent_tasks folders:
There should be no agent_tasks/ folder under /api/ (root), only under /api/src/app/.
Move any relevant files/folders from /api/agent_tasks/ into /api/src/app/agent_tasks/ if needed.
Delete the old /api/agent_tasks/ directory entirely.
Recursively scan all Python code in /api/src/app/ for import or from statements referencing the old path:
Replace any from agent_tasks... or import agent_tasks... so they point to the correct, canonical /api/src/app/agent_tasks/.
Check your PYTHONPATH or app entrypoint (if running into import errors):
Make sure the working directory (cwd) for running the backend includes /api/src/app so that agent_tasks resolves.
Run a minimal import smoke test:
python -c "from agent_tasks.middleware import prompt_builder, task_router; print('Imports OK')"
Or run your FastAPI app locally and confirm it starts with no import errors.