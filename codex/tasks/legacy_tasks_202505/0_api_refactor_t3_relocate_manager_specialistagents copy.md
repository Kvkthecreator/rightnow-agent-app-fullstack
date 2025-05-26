## codex/tasks/0_api_refactor_t3_relocate_manager_specialistagents.md

**Task 3: Relocate and Consolidate Manager and Specialist Agents**


**Prompt:**

In agent_tasks/, create manager_task.py and (if not already present) files for each specialist agent: strategy_agent.py, content_agent.py, repurpose_agent.py, feedback_agent.py.
Move each Agent definition (Agent(...)) from agent_server.py into its dedicated file (one agent per file, or, if you prefer, group all specialists into a single specialist_agents.py for now).
In manager_task.py, define a FastAPI router and /agent POST endpoint that:
Validates incoming payload (prompt, user_id, optional task_id)
Instantiates the Manager Agent (using the imported specialists as handoffs)
Runs the agent and returns a properly formatted response (using your unified output utilities).
Remove Manager and Specialist Agent definitions from agent_server.py. Ensure any references are updated to the new imports.
Commit with message: "refactor: modularize manager and specialist agents"

**Pre-req:**
Make sure each agent has a single, canonical definition. (If you see an “AGENTS” dictionary, remove and update usages.)