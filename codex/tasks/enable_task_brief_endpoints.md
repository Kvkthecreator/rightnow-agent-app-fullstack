## codex/tasks/enable_task_brief_endpoints.md

# Task: Scaffold TaskBrief Endpoints

## Goal
Implement backend support for creating and retrieving `task_briefs`, in alignment with the PRD.

## Files
- `api/src/app/routes/task_brief.py` (new)
- `api/src/app/routers.py` (add `include_router`)
- `api/src/app/models/task_brief.py` (optional: Pydantic model if used)

## Features
- [ ] `POST /task-brief`: Create new `task_brief` (with optional `core_profile_data`)
- [ ] `GET /task-brief/:id`: Fetch a task brief by ID
- [ ] Persist to Supabase via `supabase.table("task_briefs")...`

## Contract
Match `/codex/PRD/frontend_contracts/task_brief_contract.ts`

## Notes
This replaces legacy `profile-create` or `task_types` logic.

