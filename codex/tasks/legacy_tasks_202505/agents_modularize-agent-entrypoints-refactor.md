## codex/tasks/agents_modularize-agent-entrypoints-refactor.md

Objective:
Move all agent flow orchestration logic to `agent_entrypoints.py`, keeping agent class/definition code where it is. Update routers and imports as needed. Do NOT delete any agent class definitions or webhook helper utilities. If you hit any ambiguity, add a TODO or FIXME.

Steps:
1. Move all agent entrypoint logic (e.g., `run_agent`, `run_agent_direct`, any agent orchestration helpers) into `agent_entrypoints.py`.
2. Update router imports and API app setup so they only reference the new entrypoints file, not duplicate logic.
3. Do not remove or alter agent class definitions (specialist or manager agents).
4. Ensure webhook and util imports are correct after the move. If import path changes, update it.
5. Remove dead code or add TODO for anything ambiguous.
6. Add docstrings to new/updated modules.
7. Test that the server boots and `/agent` endpoint works via Postman or curl.

Acceptance Criteria:
- All orchestration logic in `agent_entrypoints.py`
- No orphaned or duplicated agent invocation code
- Routers only set up FastAPI, not orchestration
- Agent class definitions untouched
- Imports work
- `/agent` endpoint passes a POST test
