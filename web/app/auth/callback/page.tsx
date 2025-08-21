"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import YarnSpinner from "@/components/ui/OrganicSpinner";

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
        localStorage.getItem("redirectPath") || "/dashboard/home";
      localStorage.removeItem("redirectPath");
      router.replace(redirectPath);
    };

    run();
  }, [router]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <YarnSpinner size="lg" className="mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Welcome
            </h1>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your workspace...
            </p>
          </div>
        </div>
      </div>
    </SessionContextProvider>
  );
}
