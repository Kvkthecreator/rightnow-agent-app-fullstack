## codex/tasks/20250526_manager_refactor_roadmap.md

Codex Task: Manager Agent Clarification-First Refactor Roadmap

🎯 Goal

Refactor the task execution flow to allow a clarification-first approach where the manager_agent is responsible for:

Interpreting incomplete or vague user inputs.

Iteratively collecting all required fields.

Dispatching to the appropriate specialist agent only when inputs are complete.

This approach enables structured task scaffolding from minimal input while supporting form or chat-based entry.

🔧 System Architecture: Flow Overview

1. Frontend: Task Initiation (Form or Chat UI)

User selects a task_type (e.g., analyze_competitors).

Form collects partial or complete collected_inputs.

POST payload to backend:

{
  "task_type_id": "analyze_competitors",
  "user_prompt": "Analyze this competitor",
  "collected_inputs": {
    "competitor_urls": ["https://instagram.com/example"],
    "goal": ""
  }
}

2. Backend: AgentSession Creation

Create task_id, agent_session, and persist initial collected_inputs.

Invoke manager_agent with:

{
  "prompt": "Analyze this competitor",
  "task_type_id": "analyze_competitors",
  "task_id": "xyz123",
  "user_id": "user_abc",
  "collected_inputs": { ... }
}

3. Manager Agent Flow

Compares collected_inputs against the task_type's required fields.

Responds with:

// Clarification needed
{
  "type": "clarification",
  "field": "goal",
  "message": "What is your goal for this analysis?"
}

or:

// All inputs gathered
{
  "type": "structured",
  "agent_type": "competitor",
  "task_type_id": "analyze_competitors",
  "input": {
    "competitor_urls": [...],
    "goal": "Increase engagement"
  }
}

4. Specialist Agent Flow

Executes with validated input.

Returns structured output (e.g., for CompetitorTable).

Backend stores in reports table and triggers webhook.

📦 Data Models Update

1. agent_sessions

{
  id: string; // task_id
  user_id: string;
  task_type_id: string;
  agent_type: "manager" | ...;
  inputs: Record<string, any>; // Partial inputs gathered
  status: "clarifying" | "dispatched" | "completed";
}

2. reports

{
  id: string;
  task_id: string;
  output_type: string; // e.g., "CompetitorTable"
  output_json: Record<string, any>;
  status: "completed" | "error";
}

✅ Codex Task Breakdown

[ ] 1. Ensure manager_agent reads task_type_id, collected_inputs, and emits structured responses

[ ] 2. Persist inputs to agent_sessions on every new turn

[ ] 3. Emit system message (webhook) with provided_fields, missing_fields

[ ] 4. Frontend should reflect field status and allow form + chat blending

[ ] 5. Refactor specialist agents to assume all fields are validated

[ ] 6. Render output_json cleanly in reports page

🧠 Notes

This architecture is inspired by OpenAI's Clarify → Dispatch → Finalize loop.

Enables clean state tracking, easier debugging, and better UX.