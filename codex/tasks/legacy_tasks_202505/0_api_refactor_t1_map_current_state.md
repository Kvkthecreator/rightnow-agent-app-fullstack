## codex/tasks/0_api_refactor_t1_map_current_state.md

Task 1: Create a Project Map of Current State

Prompt:

List all Python files, routers, and main FastAPI endpoints under /api/src/app and /api/src/agent_tasks (including all legacy files and routers). For each file, briefly note its purpose (agent, endpoint, utility, etc.) and if it is actively referenced/used in the running system, based on imports and router inclusions.
Output: Markdown table, columns: File/Module, Purpose, Referenced By, Actively Used (Yes/No), Comments.
Purpose:
To give Codex and you a clear manifest so we know which files/routes are truly active, partially duplicated, or legacy.
(You’ll check the table, confirm, and move to Task 2.)