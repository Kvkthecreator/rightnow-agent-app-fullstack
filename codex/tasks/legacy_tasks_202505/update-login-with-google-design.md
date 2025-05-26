## 📄 Task Title

Enhance Google Login Page UI and Add Policy Pages

## 🏆 Goal

Upgrade the existing Google-only login screen to visually match the shadcn/ui `login-03` block, include branding, and add placeholder policy pages.

## 🧠 Prompt to Codex

Update the route `/login` with the following enhancements:

### Above the Card

* Add brand name: `rgtNOW`
* Placeholder for logo/icon (e.g. use a simple emoji or Lucide icon)

### Card Content

* Title: `Welcome back`
* Subtitle: `Login with your Google account`
* Horizontal separator with `Or continue with`
* Retain only the "Login with Google" button:

  * Label: `Login with Google`
  * Icon: Google (use Lucide's Chrome or similar)
  * On click: `signInWithGoogle()` placeholder function

### Below the Card (Outside)

* Add text: `By clicking continue, you agree to our Terms of Service and Privacy Policy.`
* Link `Terms of Service` to `/terms`
* Link `Privacy Policy` to `/privacy`

### Additional Pages

Create placeholder routes:

* `web/app/terms/page.tsx`: blank for now
* `web/app/privacy/page.tsx`: blank for now

## ✨ Styling

* Background: `bg-muted`
* Card: `rounded-lg shadow-sm p-6 bg-white`
* Centered layout: `flex items-center justify-center min-h-screen`
* Text: `text-sm font-medium text-center`

## ⚡ Behavior

* Google login button calls `signInWithGoogle()` (placeholder)
* Links redirect to `/terms` and `/privacy`
* DashboardLayout is **not** applied to `/login`, `/terms`, or `/privacy`

## 🔧 File Structure

* `web/app/login/page.tsx`
* `web/app/terms/page.tsx`
* `web/app/privacy/page.tsx`
* Optional component: `web/components/auth/LoginCard.tsx`

## ✅ Success Criteria

* `/login` reflects updated UI per spec
* Only one login option (Google)
* Branding and external text matches shadcn example
* Placeholder policy pages render at `/terms` and `/privacy`
* Typechecks and deploys cleanly to Vercel

## 📋 Notes for Follow-up

* Supabase auth logic (e.g. `supabase.auth.signInWithOAuth`) will be implemented later
* Add logic to redirect **from** `/login` if already authenticated
* Add real logo + connected legal pages before public launch
