## codex/tasks/ui_task_brief_form.md

# Task: Scaffold TaskBriefForm UI

## Goal
Create a new frontend form for users to submit Task Briefs before running agents.

## Files
- `web/app/task-brief/create/page.tsx` (new route)
- `web/components/TaskBriefForm.tsx` (reusable component)

## Features
- [ ] Form fields:
  - `intent` (required, multiline input)
  - `sub_instructions` (optional, textarea)
  - `media[]`: upload image + caption pairs (max 5)
  - Pull `core_profile_data` if available (GET from `/profile-core`)
- [ ] `onSubmit`: POST to `/api/task-brief`
- [ ] Redirect to `/tasks/[taskId]` after brief submission

## Types
Use `TaskBrief` + `ProfileCoreData` from `/codex/PRD/frontend_contracts/task_brief_contract.ts`

## Styling Guidelines
- ✅ Use existing design system components (e.g. `Input`, `Textarea`, `Button`, `Card`, `Label`, `FormField`, etc.)
- ✅ Apply layout utilities from your Tailwind config (e.g. `grid`, `gap`, `bg-card`, `text-muted`)
- ✅ Maintain spacing consistency with `/profile-create` and `/tasks/[taskId]`

## Notes
This flow replaces `profile-create`. All future tasks begin with a Task Brief.
