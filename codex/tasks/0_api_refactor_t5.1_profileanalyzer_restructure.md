## codex/tasks/0_api_refactor_t5.1_profileanalyzer_restructure.md

**Task 5.1: Strictly Modularize Profile Analyzer Agent & Task**

**Prompt:**
Strictly Modularize Profile Analyzer Agent & Task

Goal:
Enforce the pattern: one agent per file (*_agent.py), one task (router/endpoint) per file (*_task.py).
The /profile_analyzer endpoint should only be defined in profile_analyzer_task.py, and the agent itself (with its Pydantic models and any helper classes) must be in profile_analyzer_agent.py.

Instructions:

Create/Move Agent:
Ensure all agent logic, input/output models, and helper functions for the profile analyzer live in api/src/app/agent_tasks/profile_analyzer_agent.py.
File should define only the agent, not the API route.
Task/Endpoint File:
In api/src/app/agent_tasks/profile_analyzer_task.py, define only the FastAPI router/endpoint(s).
Import the agent and models from profile_analyzer_agent.py.
The /profile_analyzer endpoint should:
Validate the request (using Pydantic model from agent file)
Invoke the agent and handle the response
Format and return the output
Update Imports:
Ensure agent_server.py imports only the router from profile_analyzer_task.py:
from .agent_tasks.profile_analyzer_task import router as profile_analyzer_router
Remove any leftover direct imports of the agent/model from the main app file.
Cleanup:
Ensure there is no agent logic, models, or endpoint code duplicated between these files.
Delete any legacy or now-empty files left behind.
Test:
Confirm the /profile_analyzer endpoint still returns valid output.
Verify the import structure with a smoke-test.
Commit Message:

refactor: strictly separate profile_analyzer agent and task per codebase convention