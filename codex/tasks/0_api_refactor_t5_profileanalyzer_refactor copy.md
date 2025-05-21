## codex/tasks/0_api_refactor_t5_profileanalyzer_refactor.md

**Task 5: ProfileAnalyzer Refactor and Integration**

**Prompt:**
Create profile_analyzer_task.py in agent_tasks/.
Move the Agent definition, input models, and FastAPI endpoint for /profile_analyzer from profile_analyzer_agent.py and agent_server.py into this new module.
Remove the old endpoint/file, update imports, commit with message:
"refactor: migrate and consolidate ProfileAnalyzer logic"