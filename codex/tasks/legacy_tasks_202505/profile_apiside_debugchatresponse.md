## /Users/macbook/rightnow-agent-app-fullstack/codex/tasks/profile_apiside_debugchatresponse.md

🔧 Codex Task: Normalize Agent Chat Response + Ensure task_id Handling
🎯 Goal

Ensure /api/profilebuilder returns proper message_content and inserts a consistent task_id if not already defined.

🧠 Prompt to Codex

// Task: Normalize agent response and ensure task_id linkage in /api/profilebuilder route

// 1. Update the FastAPI handler for /profilebuilder to:
//    - Always return an object with: { type: "text", message_content: string }
//    - Use the actual agent output (e.g. "Sure, what would you like help with?")

// 2. Ensure that if no task_id is provided in the incoming request:
//    - Generate a UUID
//    - Insert that into the profiles table (if a new profile is created)
//    - Use the task_id when saving agent_messages

// 3. Ensure the agent message logged to Supabase includes:
//    - user_id
    - agent_type = "profilebuilder"
//    - message_type = "text"
//    - message_content = full response text
//    - task_id = generated or passed

// 4. Keep the frontend unchanged — fix the backend response and DB consistency