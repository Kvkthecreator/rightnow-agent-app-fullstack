## 📄 Task Title

Create Minimal Google-Only Login Page Using `shadcn/ui`

## 🏆 Goal

Build a sleek, minimal login screen based on the `login-03` block from shadcn/ui, but with **Google as the sole login method**. The goal is to streamline MVP auth and avoid the complexity of email/password flows.

## 🧠 Prompt to Codex

Create a new route `/login` with the following:

* A single-column login card centered on a muted background
* Based on `shadcn/ui` block `login-03`
* Only **one button**:

  * Label: `Login with Google`
  * Icon: Google G logo (from Lucide or other icon lib)
  * On click: calls `signInWithGoogle()` (placeholder)

Wrap in a new page at: `web/app/login/page.tsx`

## ✨ Styling

* Background: `bg-muted`
* Card: `rounded-lg shadow-sm p-6 bg-white`
* Centered: `flex items-center justify-center min-h-screen`
* Text styles: `text-sm font-medium text-center`

## ⚡ Behavior

* Button click triggers a placeholder `signInWithGoogle` (to be replaced with Supabase logic)
* Redirects will be handled in a follow-up task

## 🔧 File Structure

* `web/app/login/page.tsx`
* Optional: `web/components/auth/LoginCard.tsx` if component split needed

## ✅ Success Criteria

* Login screen renders at `/login`
* Google-only, no email/password/Apple flows present
* Uses shadcn styling & utility classes
* Works cleanly with `DashboardLayout` logic (i.e. dashboard layout is **not** applied on `/login`)
* No build or type errors

## 📋 Notes for Follow-up

* Supabase auth logic (e.g. `supabase.auth.signInWithOAuth`) will be integrated later
* Redirect to `/demo` after successful login
* Future state: add logic to redirect **from** `/login` if already authenticated
