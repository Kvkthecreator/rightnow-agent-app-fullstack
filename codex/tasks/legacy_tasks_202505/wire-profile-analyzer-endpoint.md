## codex/tasks/wire-profile-analyzer-endpoint.md

⚡️ Codex Task: wire-profile-analyzer-endpoint.md
## 📄 Task Title
Wire up /profile_analyzer endpoint to generate and return an Insight Report

## 🎯 Goal
Enable the frontend to generate a complete Insight Report once all profile fields are collected.

This endpoint will accept a complete user profile, invoke the ProfileAnalyzer agent, and return the agent's response in a webhook and JSON result.

## 🧠 Prompt to Codex
Create a new FastAPI POST endpoint /profile_analyzer.

It should:

Accept a JSON body with:
{
"task_id": "...",
"user_id": "...",
"profile": {
"display_name": "...",
"niche": "...",
...
}
}
Call a function: profile_analyzer_agent(profile: dict) -> dict
This function can return a placeholder response for now:
{
"summary_markdown": "## Sample summary...",
"strengths": ["You are consistent", "You know your audience"],
"blindspots": ["Your niche is too broad"],
"next_steps": ["Focus your message", "Try video content"]
}
Construct a webhook payload:
{
"task_id": "...",
"user_id": "...",
"agent_type": "profileanalyzer",
"message_type": "profile_report",
"message_content": {
"summary_markdown": "...",
"strengths": [...],
"blindspots": [...],
"next_steps": [...]
},
"created_at": ISO 8601 timestamp
}
POST this to:
https://helpmeaiai.bubbleapps.io/version-test/api/1.1/wf/bewf_profile_report_webhook/
Return the same message_content in the HTTP response
Also:

Add error handling if required fields are missing
Log the request payload and final webhook post for debugging

## 🧩 Related Files
- `app/agent_server.py` → add `/profile_analyzer` endpoint
- `agents/profile_analyzer_agent.py` → placeholder logic
- `util/webhook.py` → reuse `send_webhook(...)`