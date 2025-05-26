## codex/tasks/0_api_refactor_t2_delete_legacy_agent_router.md

Task 2: Remove Legacy Agent Router and Duplicates

Prompt:

Remove legacy_agent_router.py entirely from the repo.
Remove any inclusion/import/usage of legacy_agent_router in agent_server.py or elsewhere.
Remove any /agent_direct endpoints unless you confirm a specific use-case (not referenced in the frontend).
If any code in legacy_agent_router.py is NOT duplicated elsewhere (very rare), migrate it to the appropriate place, else delete.
Commit with message: "refactor: remove legacy agent router and all duplicate /agent routes"
Purpose:
Prevents /agent//agent_direct route confusion and ensures only one entrypoint for orchestration.