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
      console.log("🔍 OAuth callback started, full URL:", window.location.href);
      
      const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
      const code = url?.searchParams.get("code");
      const errorDescription = url?.searchParams.get("error_description");

      console.log("🔍 Code present:", !!code);
      console.log("🔍 Error description:", errorDescription || "none");

      if (errorDescription) {
        console.error("❌ OAuth provider returned error:", errorDescription);
        router.replace("/login");
        return;
      }

      try {
        if (code) {
          console.log("🔄 Exchanging code for session...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href,
          );
          if (exchangeError) {
            console.error("❌ Failed to exchange code for session:", exchangeError);
            router.replace("/login");
            return;
          }
          console.log("✅ Code exchange successful");
        }
      } catch (exchangeErr) {
        console.error("❌ Unexpected error exchanging code:", exchangeErr);
        router.replace("/login");
        return;
      }

      console.log("🔍 Getting session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("❌ Session error after callback:", sessionError);
        router.replace("/login");
        return;
      }
      console.log("✅ Session obtained:", session.user.email);

      // Then verify user
      console.log("🔍 Verifying user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn("❌ No user after callback. Redirecting to /login.");
        router.replace("/login");
        return;
      }
      console.log("✅ User verified:", user.email);

      // ✅ Redirect to correct landing page
      let redirectPath = "/baskets";
      if (typeof window !== "undefined") {
        const storedPath = localStorage.getItem("redirectPath");
        localStorage.removeItem("redirectPath");
        if (storedPath && storedPath.startsWith("/")) {
          redirectPath = storedPath;
        }
      }
      
      // Use router.replace for cleaner client-side navigation
      console.log("✅ Auth complete! Redirecting to:", redirectPath);
      router.replace(redirectPath);
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
