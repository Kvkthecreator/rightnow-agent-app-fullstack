## /codex/tasks/profile_viewer_editorpage.md

# 📄 Task Title
Scaffold Profile Viewer & Editor Page

---

## 🎯 Goal
Create the `/profile` page at `web/app/profile/page.tsx` that displays the user's saved profile input values **and** allows editing of their `profile_report_sections`.

This completes Step 3 of the user flow.

---

## 🧠 Prompt to Codex

Scaffold a page at `web/app/profile/page.tsx` with the following features:

### 🔷 1. Fetch and Display Basic Profile Info
- Use `useSessionContext()` to get current user
- Query Supabase for `profiles` where `user_id = currentUser.id`
- Display the following fields (read-only for now):
  - `profile_type`
  - `primary_objective`
  - `primary_sns_channel`
  - `sns_url`
  - `email`
  - `follower_count`
  - `locale`
  - `comments`

### 🟪 2. Load & Edit Profile Report Sections
- Query `profile_report_sections` where `profile_id = profile.id`
- For each section:
  - Display `title` and `body` in a `Card`
  - Add inline editing (e.g., textarea for body, input for title)
  - Include `Save` and `Delete` buttons
- Add a button to **create a new section** (empty or with default text)

### 📤 3. Export (Optional)
- If `profiles.report_markdown` exists, display it in a `Textarea` or read-only markdown renderer
- Add a `Copy to Clipboard` or `Download Markdown` button

### 🔁 Supabase Integration
- Use the Supabase client (`useSupabaseClient()`)
- Support the following actions:
  - `select * from profiles where user_id = session.user.id`
  - `select * from profile_report_sections where profile_id = profile.id`
  - `update`, `delete`, and `insert` for individual sections

---

## 💡 UI Tips
- Use `shadcn/ui` components: `Card`, `Textarea`, `Input`, `Button`
- Use skeleton/loading placeholders while data is fetching
- Use optimistic updates for section edits if possible

---

## 🔀 Git Workflow
- Branch: `feat/profile-viewer-editor`
- File: `web/app/profile/page.tsx`
- Commit message suggestion: `feat: scaffold profile viewer/editor page with section editing and markdown export`

Once this page is scaffolded, test with real data saved via `/profile-create` to verify full flow.
