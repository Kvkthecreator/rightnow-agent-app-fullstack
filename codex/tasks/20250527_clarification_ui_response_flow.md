## codex/tasks/20250527_clarification_ui_response_flow.md

Title

Clarification Message UI Flow and User Response Hook

Goal

Implement frontend UI behavior for manager_agent clarification flow — including system messages, clarification prompts, and user response handling that updates collected_inputs.

Components to Update

1. ChatPane.tsx
✅ Already renders system messages and agent messages.
🟡 Add support to:
Display system message: "1 of 2 fields complete. Still missing: goal"
Use a neutral style, small font, and grey tone.
Display clarification message (type: "clarification")
Show prompt (e.g., “What is your goal for this task?”)
Show response box only if field is still missing.
2. ClarificationResponse.tsx (💡 new component)
Render a minimal UI for text input tied to a specific field name.
On submit:
Call onSubmit(field: string, value: string)
Disable after submission
Prop types:
interface ClarificationResponseProps {
  field: string;
  prompt: string;
  onSubmit: (field: string, value: string) => void;
}
3. ChatWrapper or Page.tsx
Add collectedInputs: Record<string, any> state.
Add handleClarificationResponse(field, value):
Update local collectedInputs
Send new POST request to /agent with:
latest collectedInputs
same task_type_id, task_id, user_id
prompt = value (user reply)
Refetch message stream on success.
Example Flow

Backend sends:
{
  "type": "system",
  "content": {
    "provided_fields": ["competitor_urls"],
    "missing_fields": ["goal"]
  }
}
➡ Chat shows: ✅ 1 of 2 fields complete. ❌ Missing: goal.

Manager agent sends:
{
  "type": "clarification",
  "field": "goal",
  "message": "What is your goal for this competitor analysis?"
}
➡ Chat shows:
"🤖 What is your goal for this competitor analysis?"
[ Text input field ]

User types "Grow my reach" and submits.
➡ POST to /agent with:
{
  "prompt": "Grow my reach",
  "task_type_id": "analyze_competitors",
  "task_id": "abc123",
  "user_id": "user_xyz",
  "collected_inputs": {
    "competitor_urls": [...],
    "goal": "Grow my reach"
  }
}
