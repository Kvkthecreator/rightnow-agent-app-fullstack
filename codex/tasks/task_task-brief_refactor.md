### codex/tasks/task_task-brief_refactor.md 
## ✅ Refactor Plan for `task-brief/create/page.tsx`"))

refactor_plan = """
#### 🧩 Objective:
Refactor `web/app/task-brief/create/page.tsx` to:
- Fully collect required `task_briefs` table fields.
- Use the latest design system and layout shell.
- Restore visual layout parity with profile-create.
- Use updated `TaskBriefUploadButton` with multi-file upload.

---

### 🗂️ Supabase Schema Reference (task_briefs):
- `id` (uuid) – auto
- `user_id` (uuid) – from auth context
- `intent` (text)
- `sub_instructions` (text)
- `media` (jsonb)
- `core_profile_data` (jsonb)
- `created_at` (timestamptz) – auto

---

### ✍️ What We’ll Build in the Refactor:
1. `Shell` layout with page title
2. `TextInputField` for `intent`
3. `TextareaField` for `sub_instructions`
4. `TaskBriefUploadButton` (media, max 5)
5. Store uploaded URLs in local state (`media`)
6. `Create Task Brief` button → POST to Supabase
