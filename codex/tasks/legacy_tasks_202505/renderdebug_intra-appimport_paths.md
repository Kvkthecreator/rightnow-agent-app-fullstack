## codex/tasks/renderdebug_intra-appimport_paths.md

📄 Codex Task: Make intra-app imports relative & fix import paths for Render

🎯 Goal
Refactor all intra-app imports under /api/src/app/ to use dot-relative imports (e.g., from .profile_analyzer_agent import ...).
Ensure uvicorn launches using the correct import path and src is discoverable.
Fix imports of openai.tools.web_search to match actual package, or fallback if needed.
🧠 Prompt to Codex
1. In all Python files under /api/src/app/:
    - Change imports from "from app.<module>" to "from .<module>".
    - Change imports from "from app.<submodule>.<module>" to "from .<submodule>.<module>".
    - Do not touch third-party imports.
    - Do not change imports outside src/app/.

2. In /api/src/app/agent_server.py and any relevant entrypoint:
    - If using relative imports everywhere, make sure the uvicorn command is:
        uvicorn app.agent_server:app --host 0.0.0.0 --port 10000
      **AND** that the current working directory for deployment is /api/src/
      OR
      uvicorn src.app.agent_server:app ... **AND** the working directory is /api/

    - Print the required working directory and uvicorn command to use with Render.

3. In /api/src/app/profile_analyzer_agent.py:
    - If 'from openai.tools.web_search import web_search_tool' fails, try 'from openai_agents.tools.web_search import web_search_tool'.
    - If both fail, print a warning: "web_search_tool not available. Check openai-agents version."

4. Print a summary of all files changed, and highlight the required deployment command and working directory.
