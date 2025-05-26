## codex/tasks/supabase_auth_callbacklogicupd.md

title: Update Supabase OAuth callback page to Supabase JS v2+ (remove getSessionFromUrl)
description: |
  Migrate /app/auth/callback/page.tsx to Supabase Auth v2+:
    - Remove all use of supabase.auth.getSessionFromUrl().
    - Replace with supabase.auth.getSession().
    - If session exists, redirect to /profile. If not, redirect to /login after showing an error.

files:
  web/app/auth/callback/page.tsx:
    replace: |
      "use client";
      import { useEffect, useState } from "react";
      import { useRouter } from "next/navigation";
      import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

      export default function AuthCallbackPage() {
        const router = useRouter();
        const supabase = createClientComponentClient();
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          const checkSession = async () => {
            // In Supabase JS v2+, getSession() is all you need.
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) {
              setError("Authentication failed. Please try logging in again.");
              setTimeout(() => router.replace("/login"), 1500);
              return;
            }
            router.replace("/profile");
          };
          checkSession();
        }, [router, supabase]);

        if (error) {
          return <div className="text-center py-20 text-red-600">{error}</div>;
        }

        return (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg font-medium">Signing you in…</p>
          </div>
        );
      }
