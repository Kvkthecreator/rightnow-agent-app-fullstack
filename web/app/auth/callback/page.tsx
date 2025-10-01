"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/clients";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import YarnSpinner from "@/components/ui/OrganicSpinner";

const supabase = createBrowserClient();

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      console.log("🔍 OAuth callback started");
      
      // Supabase auth-helpers automatically handle the OAuth callback
      // Just get the session that Supabase already created
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("❌ Session error after callback:", sessionError);
        router.replace("/login");
        return;
      }

      // Verify user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn("❌ No user after callback. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      console.log("✅ User authenticated:", user.email);

      // Get redirect path
      const redirectPath = 
        (typeof window !== "undefined" && localStorage.getItem("redirectPath")) || 
        "/baskets";
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("redirectPath");
      }

      console.log("✅ Redirecting to:", redirectPath);
      
      // Use window.location for full page load (ensures cookies are sent)
      window.location.href = redirectPath;
    };

    run();
  }, [router]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div className="min-h-screen w-full flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-sm bg-card border rounded-xl shadow-sm px-6 py-8 space-y-6">
          <div className="text-center space-y-6">
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
      </div>
    </SessionContextProvider>
  );
}
