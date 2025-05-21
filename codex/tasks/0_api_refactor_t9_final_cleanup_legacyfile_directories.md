## codex/tasks/0_api_refactor_t9_final_cleanup_legacyfile_directories.md

## Task 9: Clean Up Legacy Files and Directories

**Goal:**  
Remove all obsolete files, directories, and cache left behind from the refactor.

---

### Instructions

1. **Remove Empty/Obsolete Files and Dirs:**
   - Delete any now-empty or legacy files and folders, such as:
     - Old agent files (e.g., profilebuilder_agent.py, specialist_agents.py, profile_analyzer_agent.py, etc.)
     - Unused routers or modules not in agent_tasks/
     - All `__pycache__` directories under `/api/src/app/` and `/api/src/agent_tasks/`
   - Ensure that only the following directories and files remain:
     - `/api/src/app/agent_tasks/` (with only active task files and middleware)
     - `/api/src/app/util/` (only shared utilities)
     - `/api/src/app/agent_server.py` (or main.py, if renamed)
     - Any essential config files.

2. **Verify with a File Tree:**
   - Output a file tree for `/api/src/app/` and `/api/src/app/agent_tasks/` after cleanup.

3. **Commit:**
   - **Commit with message:**  
     ```
     chore: final cleanup of legacy agent system files
     ```

---