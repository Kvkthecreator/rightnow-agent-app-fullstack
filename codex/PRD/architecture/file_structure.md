## codex/PRD/architecture/file_structure.md

## File Structure

### /api/src/app/

* `agent_entrypoints.py`: Central API router calling manager and specialist agents
* `agent_tasks/`: One file per agent; encapsulates prompt, tools, logic
* `util/`: Helpers shared across agent logic (e.g. Supabase, validation)
* `constants.py`: Central config and webhook URLs

### /web/app/

* `profile-create/`: Multi-step profile creation flow using form-driven logic
* `tasks/`: Task brief creation and execution flows
* `components/`: Shared UI elements like TaskForm, MessageCard, ReviewRow, UploadButtons
* `lib/`: Supabase client, upload helpers, and utility hooks

### codex/PRD/architecture/erd.png

Reflects the post-refactor schema centered around `task_briefs` and `profile_core_data`, replacing the deprecated `profiles` and `profile_report_sections` tables.

* `profile_core_data`: Stores brand identity and user intent inputs
* `task_briefs`: Reusable containers for intent + media-rich briefs
* `agent_sessions` / `agent_messages`: Store reasoning steps and agent output history
* `reports`: Structured JSON outcomes and status tracking

📌 File structure is aligned with clean separation between persistent brand inputs (profile) and task-specific execution (task briefs), enabling scalable agent workflows.
