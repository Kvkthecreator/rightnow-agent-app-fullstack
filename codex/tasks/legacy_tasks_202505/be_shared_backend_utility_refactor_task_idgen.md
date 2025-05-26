## /Users/macbook/rightnow-agent-app-fullstack/codex/tasks/be_shared_backend_utility_refactor_task_idgen.md

# 🧱 Codex Task: Adopt Shared Task + Session Utility Across Agent Endpoints

## 📄 Task Title  
Apply create_task_and_session across all agent routes

## 🎯 Goal  
Now that we’ve implemented and validated `create_task_and_session(user_id, agent_type, metadata)`, this task will:

- Apply it across all agent FastAPI routes (e.g. `/strategy`, `/content`, `/repurpose`)
- Remove any inline UUID generation logic
- Ensure consistent task_id tracking for all agent sessions

This will unify session management and reduce redundancy in agent initialization.

---

## 🧠 Prompt to Codex

```py
# Objective:
# Refactor all existing FastAPI agent endpoints to adopt the shared backend utility:
# from app.util.task_utils import create_task_and_session
#
# Requirements:
#   - If a request payload does not include `task_id`, call the utility:
#       task_id = create_task_and_session(user_id, agent_type)
#   - Preserve compatibility: if `task_id` *is* passed, use it directly
#   - Do not change input/output structure for now (we’ll expand metadata later)
#   - Maintain all existing webhook behavior, including message logging and Supabase inserts

# Target files:
# - /api/src/app/strategy.py
# - /api/src/app/content.py
# - /api/src/app/repurpose.py
# (or any other route handlers following the same pattern)

# Notes:
# - Avoid modifying profilebuilder.py — it has already been updated
# - Do not change task_utils.py — the utility is stable
# - Include a clear commit message like: "refactor: adopt shared task_id logic across agents"
