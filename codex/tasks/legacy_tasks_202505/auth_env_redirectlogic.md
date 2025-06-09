## codex/tasks/auth_env_redirectlogic.md

Task Title
Fix Supabase Auth Redirect Logic for Local, Vercel, and Custom Domain Environments

Task Scope
Goal:

Ensure users are redirected to the correct domain after login with Supabase Auth, both locally and in production (Vercel and custom domain).
Use environment variables for dynamic base URLs.
Ensure login state is retained after redirect.
If possible, always redirect to /profile (or another desired route) after login, using the current domain.
Files to Create/Update
app/auth/callback/page.tsx (or [...callback]/page.tsx if using a catch-all)
Any helper under lib/ or utils/ if you abstract login logic
Any auth-related context/provider if you have one (optional)
(No need to change env files—assume they're set.)
Instructions for Codex
Update all places where Supabase Auth redirectTo is set (sign-in and magic link flows):
Set it to ${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback
Never hardcode Vercel or local URLs—always use this env var.
In your auth/callback route handler (page.tsx or api/route.ts):
On callback, restore user session using Supabase Auth helpers as usual.
After session is restored, use router.push('/profile') (or desired route) to navigate the user.
For local dev:
Confirm that .env.local has NEXT_PUBLIC_SITE_URL=http://localhost:3000
For production:
Confirm that Vercel envs have NEXT_PUBLIC_SITE_URL=https://yarnnn.com
Example Implementation:
(Update as needed to match your app structure and hooks)
// app/auth/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // if using
import { useSupabase } from "@/lib/supabaseClient"; // if using context

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useSupabase ? useSupabase() : createClientComponentClient();

  useEffect(() => {
    // Supabase will handle session restoration via cookies by default
    // Add any loading, error, or session handling logic here as needed

    // Redirect after short delay or once session is present
    const timeout = setTimeout(() => {
      router.replace("/profile");
    }, 500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-lg font-semibold">Signing you in...</p>
      {/* Optionally show a spinner */}
    </div>
  );
}
If you use the Supabase Auth client on the login page
Example for Google OAuth:
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
});
For email magic links:
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
});
Test:
On all environments, confirm login redirects you to /profile on the same domain.
Confirm auth state is persisted (no double-login).
Optional: Show Error States
If Supabase returns an error (expired magic link, etc), show a user-friendly message in auth/callback/page.tsx.

Summary for Codex
Make Supabase Auth callback logic environment-aware. Always redirect users to /profile on the domain matching their login flow (local, Vercel, custom domain). Never hardcode redirect URLs—always use NEXT_PUBLIC_SITE_URL. Show a loading indicator during auth hand-off. Show an error if session restore fails.
