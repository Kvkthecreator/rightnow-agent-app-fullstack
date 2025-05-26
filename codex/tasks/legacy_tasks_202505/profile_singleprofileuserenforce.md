## codex/tasks/profile_singleprofileuserenforce.md

// Codex Task: Enforce Single Profile per User and Update Frontend Logic

// Goal: Ensure each signed-in user has at most ONE profile. If a user already has a profile, show/edit it; if not, prompt to create one.
// Clean up any old multi-profile logic. This is for the /profile and /profile-create flows in the Next.js App Router (using Supabase).

// Prereqs (done by human):
// - The Supabase "profiles" table is clean (only one profile per user).
// - The "user_id" column in "profiles" is set as UNIQUE.

Files to update or create:
// - app/profile/page.tsx       // main profile view
// - app/profile/create/page.tsx // profile creation/edit page
// - (any shared hooks or helpers if needed)

Instructions:
1. In **app/profile/page.tsx**:
    - On page load, check if a user is signed in.
    - Fetch the profile for the current user (via Supabase, filtering by user_id).
    - If a profile exists, render the profile details (and maybe an “Edit” button).
    - If **no profile exists**, redirect to /profile/create (or show a CTA/link to create one).

2. In **app/profile/create/page.tsx**:
    - If a user already has a profile, pre-fill the form with their info for editing.
    - On form submit, **update** the profile if it exists, otherwise **insert** a new one.
    - After creation or edit, redirect back to /profile.

3. Remove any old “multiple profile” logic (e.g., don’t show “Add another profile” anywhere).
4. All Supabase queries for “profiles” must filter by user_id, and should always expect 0 or 1 result.

5. (Optional) If it helps, add a custom hook like `useProfile()` to wrap this logic, to keep things DRY.

6. Tailwind, UI, and all user-facing text should make it clear: you have ONE profile (not multiple).

// End of task. Don’t forget to test both the “first time create” and “edit profile” paths with a real user!
