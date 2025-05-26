## codex/tasks/0_api_refactor_t4_profilebuilder_refactor.md

**Task 4: ProfileBuilder Refactor and Integration**

Prompt:

Move the ProfileBuilder POST endpoint/logic out of profilebuilder.py and into agent_tasks/profilebuilder_task.py
Delete profilebuilder_agent.py if not called by any endpoint.
Update all imports/usages accordingly.
Move shared utilities to middleware/util as needed.

**Pre-req:**

None, just ensure previous commit is pushed.