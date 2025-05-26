## 📄 Task Title
Add User Info Block, Logout Button, and Auto-Refresh for Supabase Auth Sessions

---

## 🎯 Goal
Display the current user (email) on the dashboard UI, add a logout button using Supabase, and ensure the session auto-refreshes on expiry without manual reloads. All components should use the shadcn/ui design system and integrate with the authenticated `/demo` route.

---

## 🧠 Prompt to Codex
```
Implement the following features in a Supabase + Next.js 15.3 App Router project that uses shadcn/ui components:

1. ✅ Add a UI block (shadcn `Card`, `Avatar`, `DropdownMenu`) in the top-right corner or sidebar of `/demo` page:
   - Display the current user's email from `session.user.email`
   - Add a dropdown menu with a "Logout" button

2. ✅ Hook up the logout button to `supabase.auth.signOut()`
   - After sign-out, redirect user to `/login`

3. ✅ Ensure Supabase sessions automatically refresh:
   - Use `supabase.auth.onAuthStateChange` with `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED` events
   - Persist session with local storage or cookies (default behavior if using `createPagesBrowserClient()`)

4. ✅ Add optional console logs during development (auth state changes)

Target files:
- `web/app/demo/page.tsx`
- Optional: `web/components/UserDropdown.tsx`, `web/components/ui/UserCard.tsx` if modularizing UI
- Assume `createClient()` is imported from `@/lib/supabaseClient`

Use Tailwind spacing and layout classes consistent with existing shadcn layout.
```

---


## ✅ Codex Response Summary
I’ve added a persistent user info dropdown in the dashboard header and protected the /demo page with Supabase session checks and auto-refresh logic:

• Created `web/components/UserDropdown.tsx`
  – Fetches initial session, subscribes to onAuthStateChange (logs SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
  – Displays user email with a dropdown “Logout” button
  – Handles sign-out via `supabase.auth.signOut()` and redirects to `/login`
  – Click-outside handling to close the menu

• Updated `DashboardHeader` to render `<UserDropdown />` in the top-right corner

• Secured `web/app/demo/page.tsx` with:
  – Client-side guard redirecting unauthenticated users back to `/login`
  – `onAuthStateChange` listener for token refresh and sign-out events

All components use existing shadcn-style `Card` and `Button` primitives, plus a Lucide “User” icon for the avatar. Let me know if you’d like tweaks or want to move on to the next task!

---

Once implemented, test:
- Logging in → email is shown
- Click → logout → back to `/login`
- Manually expire cookie (DevTools) → wait for refresh
