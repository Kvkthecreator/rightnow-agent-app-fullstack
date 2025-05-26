## codex/tasks/20250526_frontend-tasktypei+chatflowblending.md

## Codex Task: Frontend Task Type UI + Chat Flow Blending

### 🌟 Goal

Allow task creation to begin from a structured form UI and continue in chat mode if required fields are missing.

This bridges form-based convenience with chat-based flexibility, ensuring users can always complete their tasks regardless of starting point.

---

## 📁 Scope

### Pages Affected:

* `web/app/tasks/[taskId]/page.tsx` (Task detail screen)
* `web/components/task/TaskHeader.tsx` (optional)
* `web/components/chat/ChatPane.tsx` (renders chat-based messages)
* `web/components/form/TaskForm.tsx` (renders initial input fields for the task type)

---

## 🔄 Behavior Overview

### Step 1: Task Type Form Input

* User selects a task type (e.g., Analyze Competitors)
* System loads the input fields via `/api/task_types`.
* Renders `TaskForm` with pre-filled values (if any).
* When user submits, a `task_id` is created.

### Step 2: Dispatch to Manager Agent

* User form inputs are sent via `POST /agent` with:

```ts
{
  user_prompt: "", // optionally empty
  task_type_id: "analyze_competitors",
  collected_inputs: { goal: "...", competitor_urls: [...] }
}
```

### Step 3: Render Initial Chat Flow

* `ChatPane` should render system message:

```json
{
  type: "system",
  content: {
    provided_fields: ["goal"],
    missing_fields: ["competitor_urls"]
  }
}
```

* Then the next message from the agent is a clarification:

```json
{
  type: "text",
  content: "Which competitor accounts would you like me to analyze?"
}
```

* User replies, appends to chat.

### Step 4: Completion

* Once manager emits a `structured` payload, backend routes to specialist.
* Final webhook returns structured `output_type` (e.g., CompetitorTable).
* UI re-renders using `RendererSwitch`.

---

## 🔄 Component Adjustments

### TaskForm.tsx

* After submit, redirect to `/tasks/[taskId]` (chat-based thread)
* Optional: Collapse form after submission

### ChatPane.tsx

* If `agent_type == manager` and task is not complete:

  * Watch for `system` message and show UI to explain missing fields
  * Maintain conversational flow

---

## ✅ Success Criteria

* Users can submit incomplete forms
* Manager agent clarifies only missing fields
* Chat flow resumes with smooth UX
* Structured report output is rendered once complete

Let me know when you're ready to execute this or want help scaffolding the code changes!
