## codex/tasks/profilebuilder-retry-blank-input.md

✅ Codex Task: profilebuilder-retry-blank-input.md

## 📄 Task Title
Add retry logic for blank inputs in ProfileBuilder agent

## 🎯 Goal
Prevent the agent from proceeding or getting stuck if the user sends an empty or whitespace-only message.

If the user gives a blank input (e.g., just hits Enter), the agent should repeat the same question once. If it happens again, it can optionally skip or acknowledge and move on.

## 🧠 Prompt to Codex
Update the ProfileBuilder agent logic to:

Strip the incoming prompt (user_input = prompt.strip())
If the user input is blank:
Check if a retry already occurred for the current field
If not retried yet:
Log that a retry is happening (can use in-memory store or Supabase if needed)
Return a text message like: "No worries — just checking again. What niche or topic best describes your content?"
If already retried:
Either:
Skip the field
Or respond with: "No problem, we’ll move on for now."
If the user input is non-blank:
Assign it to the correct field
Post the profile_partial webhook
Move to the next question
Optional:

Use a retry tracker like: retries = {"niche": 1} (reset it after field is answered)
Retry state can be stored temporarily per agent run or persisted if needed
Ensure response still follows:
{
"type": "text",
"message_content": "..."
}


## 🧩 Related Files
- `agents/profilebuilder_agent.py`
- `util/supabase_helpers.py` (optional if tracking retries there)

✳️ Subtask: Add retry logic for blank user inputs

# profilebuilder_agent.py — inside main logic loop
user_input = prompt.strip()

# Track retries in memory (not persisted)
retry_tracker = {}  # or reuse global or passed-in dict if needed

if not user_input:
    field = current_expected_field

    if retry_tracker.get(field, 0) < 1:
        retry_tracker[field] = retry_tracker.get(field, 0) + 1

        return {
            "type": "text",
            "message_content": f"No worries — just checking again. {QUESTION_FOR_FIELD[field]}"
        }
    else:
        return {
            "type": "text",
            "message_content": "No problem, we’ll move on for now."
        }
You can also describe to Codex:

You can optionally reset retry_tracker[field] once a valid response is recorded.
It’s okay to store retry state locally per call for now — no need to persist to Supabase yet.