## codex/tasks/0_api_refactor_t7_standardize_output_webhook_utils.md

## Task 7: Refactor and Standardize Output/Webhook Utilities

**Goal:**  
Centralize and standardize all output formatting and webhook payload logic across agent tasks.

---

### Instructions

1. **Consolidate Output Helpers:**
   - Move all output formatting helpers (such as `build_payload`, `flatten_payload`, etc.) into a new file:  
     `api/src/app/agent_tasks/middleware/output_utils.py`
   - If a utility function is only used by a specific agent, move it to that agent’s module; otherwise, keep it in `output_utils.py`.

2. **Unify Webhook Sending:**
   - Ensure all webhook sending uses a single utility (`send_webhook` from `util/webhook.py` or the centralized version).
   - Remove any duplicate or ad-hoc webhook payload dicts. All webhook payloads should be constructed using the output utility helpers.

3. **Update All References:**
   - Refactor all agent task modules (`manager_task.py`, `profilebuilder_task.py`, `profile_analyzer_task.py`, etc.) to use the new output and webhook utilities.
   - Search for any inline dicts or legacy formatting and replace with utility calls.

4. **Enhance Utilities (if needed):**
   - If you have special message types (e.g., `"step_complete"`), add support to the utility function(s).

5. **Remove Duplicates:**
   - Delete any old or duplicate output/webhook payload code left behind in agent task modules or util.

6. **Test & Commit:**
   - Smoke-test the `/agent`, `/profilebuilder`, and `/profile_analyzer` endpoints to ensure webhook and output formatting works as expected.
   - **Commit with message:**  
     ```
     refactor: unify output and webhook formatting across agent tasks
     ```

---

**Note:**  
If any pre-requisite (such as pushing current changes) is needed before this task, pause and notify the user before executing.