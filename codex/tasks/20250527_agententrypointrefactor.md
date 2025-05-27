## codex/tasks/20250527_agententrypointrefactor.md

# Task: Eliminate webhook-based output architecture
# Priority: High
# Goal: Refactor the FastAPI agent flow to return structured results directly to the frontend, removing all webhook logic.
# Context: The app has transitioned away from Bubble and now uses a Vercel frontend + Render FastAPI backend.

## Background
Previously, agent results were sent to third-party endpoints via webhook (e.g., `CLARIFICATION_WEBHOOK_URL`, `STRUCTURED_WEBHOOK_URL`). That pattern was required to send structured outputs back to Bubble. This architecture is now obsolete.

The frontend now uses direct API calls via `/api/agent` and `/api/agent/direct`, so agent outputs should be returned inline in the HTTP response.

## Requirements

1. ✅ Remove the following:
   - `send_webhook()` utility function (in `webhook.py`)
   - Any imports from `constants.py` related to webhook URLs
   - Calls to `await send_webhook(...)` in `agent_entrypoints.py`

2. ✅ Refactor all webhook dispatch sections in `run_agent()` and `run_agent_direct()` to:
   - Return structured `dict` responses directly from FastAPI
   - Include keys: `ok`, `task_id`, `agent_type`, `output_type`, `message`, and optionally `trace`

3. ✅ Delete `constants.py` if it's only used for webhook URLs

4. ✅ Ensure graceful handling of:
   - JSON parse errors
   - Agent result fallbacks
   - Validation failures

5. ✅ Update all fallback logic (`clarification`, `parse_error`, etc.) to return inline via HTTP response instead of webhook

6. 🚫 Do not modify:
   - Agent logic (`Runner.run(...)`)
   - Task routing (`route_and_validate_task`)
   - Supabase persistence (inputs/status updates)

## Example expected return from /agent:
```json
{
  "ok": true,
  "task_id": "xyz123",
  "agent_type": "manager",
  "output_type": "structured",
  "message": {
    "type": "structured",
    "data": { ... }
  },
  "trace": [ ... ]
}
'''

## *** Notes: ***

Make sure return payloads remain consistent between run_agent and run_agent_direct.
If removing flatten_payload(...) simplifies the output, that's also allowed.
Code must remain cleanly testable and resilient to bad agent outputs.
Scope Check:

If you detect any webhook-reliant logic still hardcoded in the frontend (e.g. /api/agent fetch handlers), notify but do not refactor it in this task.