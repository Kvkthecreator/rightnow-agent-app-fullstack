## codex/tasks/0_api_refactor_t8_update_appmain_routers_imports.md

## Task 8: Update App Main, Routers, and Imports

**Goal:**  
Ensure that the FastAPI app entrypoint (`agent_server.py` or `main.py`) is clean and only includes the new modular routers and correct imports.

---

### Instructions

1. **Update Main App Imports:**
   - In the main FastAPI app file (`api/src/app/agent_server.py` or `main.py`):
     - Only include routers from the new agent_tasks modules:
       - `from agent_tasks.manager_task import router as manager_router`
       - `from agent_tasks.profilebuilder_task import router as profilebuilder_router`
       - `from agent_tasks.profile_analyzer_task import router as profile_analyzer_router`
     - Remove all legacy imports from deleted files (e.g., `profilebuilder_agent.py`, `legacy_agent_router.py`, `agent_entrypoints.py`, etc.).
     - Verify import paths for all agent task modules, specialist agents, and shared utilities.

2. **Register Only Required Routers:**
   - Register only the routers from the new agent_tasks modules with FastAPI:
     - `app.include_router(manager_router)`
     - `app.include_router(profilebuilder_router)`
     - `app.include_router(profile_analyzer_router)`
   - Remove any includes for legacy routers or endpoints.

3. **Test:**
   - Ensure the app runs (`uvicorn`/`poetry run`/`python -m`).
   - Confirm that `/agent`, `/profilebuilder`, and `/profile_analyzer` endpoints all respond correctly.

4. **Commit:**
   - **Commit with message:**  
     ```
     chore: update app imports and routers for new agent_tasks structure
     ```

---

**Note:**  
If any import error or missing router is detected, fix it before proceeding.
