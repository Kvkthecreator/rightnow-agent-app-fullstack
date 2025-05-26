## codex/tasks/be_refactor-profilebuilder-agent-field-tracking.md

🧠 Codex Task: refactor-profilebuilder-agent-field-tracking
Here’s a complete task template you can drop into codex/tasks/:

## 📄 Task Title
Refactor ProfileBuilder agent to track collected fields via Supabase

## 🎯 Goal
Fix the ProfileBuilder agent so it correctly tracks which fields have been collected using Supabase as the source of truth.

Currently, the agent:
- Keeps assigning all user inputs to the `niche` field
- Repeats the same follow-up question (e.g. “Who are you hoping to reach?”) even after it’s been answered

## 🧠 Prompt to Codex
Refactor the profilebuilder_agent to:

On each agent invocation, look up existing profile data from Supabase using task_id and user_id.
You can fetch profile_partial values that were saved via the webhook handler.
Consider creating a helper like: get_collected_fields(user_id, task_id) -> dict
Determine the next missing field based on this ordered list:
["niche", "audience_goal", "content_frequency", "monetization_goal", "platforms", "follower_count"]
Match the user’s input to the next expected field and:
Create a profile_partial webhook payload with the key/value
Send a text webhook with the next question in sequence, or a final “Thanks! You can now review your profile.” message if complete
Return the same agent message (text) in the function response
Also:

Avoid repeating any question that’s already been answered
Add basic logging of: the current field name, the collected value, and the next field selected
Optional: Handle blank/empty inputs by repeating the question once

Ensure the agent response is structured as:
{
"type": "text",
"message_content": "..."
}

🧩 Related Files

agents/profilebuilder_agent.py
webhooks/profile_partial_handler.py (if needed for storage ref)
supabase_helpers.py (add get_collected_fields() if not exists)
- `util/supabase_helpers.py` (new) → add `get_collected_fields()` here


✅ Option 1: Minimal Amendment (Add this to the bottom of the existing .md)

---

## ✳️ Subtask: Implement Supabase helper `get_collected_fields()`

Add a helper function in `supabase_helpers.py`:

```python
def get_collected_fields(user_id: str, task_id: str) -> dict:
    """
    Query the Supabase table where profile_partial values are stored (e.g., 'agent_messages' or 'profile_draft').
    Filter by user_id and task_id.
    For message_type = 'profile_partial', extract the message_content dict and flatten all keys into one dict.
    
    Example return:
    {
        "niche": "English teacher",
        "audience_goal": "Teens beginner level",
        ...
    }
    """