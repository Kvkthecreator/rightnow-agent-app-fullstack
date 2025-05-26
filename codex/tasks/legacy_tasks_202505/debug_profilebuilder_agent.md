## debug_profilebuilder_agent.md
📄 Codex Task Template — debug-profilebuilder-agent

## 🎯 Goal
Ensure the profilebuilder agent works correctly within the Deep Dive Collect step of profile creation.

Specifically:

Kick off the conversation with a clear, helpful system message as soon as Step 2 loads.
Guide the user through collecting the 6 structured fields in a conversational flow.
Ensure messages are posted to the appropriate webhook endpoints:
profile_partial → when a field value is collected
text → for all agent-generated prompts/questions

## 💬 Questions to collect (6 total)
Assuming display_name is already gathered in Step 1, these are the remaining profile fields to be collected by the agent in order:

niche
“What niche or topic best describes your content?”
audience_goal
“Who are you hoping to reach?”
platforms
“Which platforms do you post on?”
follower_count
“Roughly how many followers do you have in total?”
content_frequency
“How often do you post?”
monetization_goal
“What’s your primary revenue goal?”
🧠 Prompt to Codex
The `/profilebuilder` endpoint should:

1. Immediately send a kickoff system message like:
   “Hi! I’m here to help build your creator profile. I’ll ask you a few quick questions to understand your goals better.”

2. Then, sequentially ask the 6 profile questions listed above. Each response should be parsed, validated (non-empty), and sent as a `profile_partial` webhook in this format:

{
  "task_id": "...",
  "user_id": "...",
  "agent_type": "profilebuilder",
  "message_type": "profile_partial",
  "message_content": {
    "<field_key>": "<user_value>"
  },
  "created_at": "..."
}

3. After each field is captured, send the next `text` prompt for the upcoming question.

4. If a user skips or gives a blank input, retry the same question once.

5. When all 6 fields are collected, send a final text message like:
   “Thanks! You can now review and edit your answers before generating your Insight Report.”

Log prompt, task_id, and user_id on each message loop for debugging. The agent should avoid repeating fields already collected.

Responses should return:
{
  "type": "text",
  "message_content": "..."
}