## codex/tasks/agentflow_agent_server_endpointdebug.md

🧠 Codex Task — Context-Specific for Your Monorepo

📄 Task Title
Implement /agent POST Endpoint for Agent Orchestration (Next.js + FastAPI Integration)

🎯 Goal
Add a FastAPI POST endpoint at /agent in api/src/app/agent_server.py that enables your Next.js frontend (in /web) to submit agent task payloads and receive structured responses.
This endpoint must:
Accept the JSON structure used by /profile/jamie-test (see current fetch("/agent", { method: "POST", ... }) in /web/app/profile/jamie-test/page.tsx)
Call the existing run_agent async function with the request and relay the result.
Handle errors for missing/invalid payloads.
Return HTTP 200 with structured agent response or HTTP 422/500 with error message as appropriate.
Add/Update README with an example usage/curl.
Briefly document how this endpoint is meant to be used as the "universal agent entrypoint" for frontend testing/dev and future integration.
🧠 Prompt to Codex
You are working in a Git monorepo with this structure:

- /rightnow-agent-app-fullstack/
    - /api/
        - /src/
            - /app/
                - agent_server.py  # <- where FastAPI is defined
                - profile_analyzer_agent.py
                - profilebuilder_agent.py
                - [other agent files...]
    - /web/
        - /app/
            - /profile/
                - jamie-test/page.tsx  # <- Next.js dev playground for agent output

Currently, the frontend playground at `/profile/jamie-test` sends a POST request to `/agent` with a profile analysis payload. This fails with a 405 error because no backend POST /agent endpoint exists.

**Task:**

1. Add a POST endpoint `/agent` in `agent_server.py`.
    - It should accept the same JSON shape as used in `jamie-test/page.tsx`.
    - Delegate processing to the `run_agent` async function.
    - Return the agent’s response (JSON, typically `{"ok": True}` or structured agent output).
    - If required fields (like `prompt`, `user_id`) are missing, return a 422 error with a helpful message.
    - If any processing error occurs, return a 500 with an error message.

2. Add a short docstring to the endpoint explaining:
    - Purpose as frontend-agent integration point.
    - Example payload and response.

3. In the monorepo README (or relevant `/api/README.md`), add an example `curl` and a note that `/agent` is now available for integration/testing.

4. (Optional but ideal) Add a basic test to `test_agent_server.py` (if present) or describe what a test should look like.

**Examples:**

- Expected frontend POST to `/agent`:

```json
{
  "prompt": "Give me an audience analysis.",
  "user_id": "test-123",
  "task_id": "task-xyz"
}