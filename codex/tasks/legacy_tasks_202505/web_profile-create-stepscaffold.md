## codex/tasks/web_profile-create-stepscaffold.md

Task 1: Scaffold the Three-Step Profile-Create Page

Goal:
Create a three-step profile creation wizard in /web/app/profile-create/page.tsx (you’re using kebab-case and singular profile-create in your actual app, not /app/profile/create/page.tsx as in the generic task).

Codex Task
### Task: Scaffold a Three-Step Profile Creation Wizard

#### Goal
Create or update the file:
- `web/app/profile-create/page.tsx`

Implement a three-step wizard for user profile creation:

**Step 1:** “Profile Basics” form fields (e.g. name, email, role, etc.)
**Step 2:** “Deep Dive Details” form fields (more nuanced inputs: niche, goals, audience, etc.)
**Step 3:** Read-only review of all fields + “Generate Report” button.

- Show a top progress indicator (Step X of 3).
- Include “Back” and “Next” buttons (disable Back on Step 1, Next on Step 3).
- Store form state in local React state (useReducer or useState).
- Add smooth vertical transitions between steps (using Framer Motion if available, or simple Tailwind transitions).
- Use Tailwind styling, matching other rightNOW pages.
- Place any helper components in `web/components/profile-create/` if needed.
- Export a default React component.

**Notes:**
- Hold all state in memory until submission.
- Use standard HTML `<input>`, `<select>`, `<textarea>` tags (not a chat UI).
- No API integration yet—just local UX.