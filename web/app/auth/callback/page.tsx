"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

const supabase = createPagesBrowserClient();

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("❌ No user after callback. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      // ✅ Redirect to correct landing page
      const redirectPath =
        localStorage.getItem("redirectPath") || "/onboarding/new-workspace";
      localStorage.removeItem("redirectPath");
      router.replace(redirectPath);
    };

    run();
  }, [router]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <p>✅ Login successful. Redirecting...</p>
    </SessionContextProvider>
  );
}
