## codex/tasks/0_api_refactor_t6_onboarding_cleanup.md

**Task 6: Evaluate and Integrate/Remove Onboarding Task**

Goal:
Clean up the agent_onboarding.py file. Remove it if unused; otherwise, migrate it to fit the new agent_tasks structure.

**Prompt:**

Check for Usage:
Search the entire codebase (/api/src/app/ and /web/ front end) for any import, inclusion, or call to agent_onboarding.
If there are no references (not used in any router, endpoint, or frontend call):
If Unused—Delete:
Delete api/src/app/agent_onboarding.py.
Remove any leftover references or documentation that mention this file.
Commit message:
cleanup: remove unused agent_onboarding.py and references
If Needed—Migrate:
If agent_onboarding.py is used (imported or referenced somewhere), move its logic into api/src/app/agent_tasks/onboarding_task.py:
Ensure all agent logic is in onboarding_agent.py
All endpoint/route logic is in onboarding_task.py
Update all imports in the codebase to use the new path and structure.
Commit message:
refactor: migrate onboarding agent to agent_tasks/onboarding_task.py
Final Check:
Confirm with a smoke-test that all endpoints and imports still work.
List the results for review.
