## File Structure

### /api/src/app/
- `agent_entrypoints.py`: Central API router calling manager and specialist agents
- `agent_tasks/`: One file per agent; encapsulates prompt, tools, logic
- `util/`: Helpers shared across agent logic (e.g. Supabase, validation)
- `constants.py`: Central config and webhook URLs

### /web/app/
- `tasks/`: Task creation + run interface
- `components/`: Shared UI elements like TaskForm, MessageCard
- `lib/`: Supabase client and utility hooks

    │  codex/PRD/architecture/erd.png reflects post-refactor schema
    📌 This ERD reflects the post-refactor schema centered around task_briefs and profile_core_data, replacing profiles and profile_report_sections.