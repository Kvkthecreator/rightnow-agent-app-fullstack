"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { getRedirectPath } from "@/lib/auth/getRedirectPath";

const supabase = createPagesBrowserClient();

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

      const redirectPath = getRedirectPath();
      console.info(`✅ Auth successful. Redirecting to ${redirectPath}...`);
      router.replace(redirectPath);
    };

    run().finally(() => setLoading(false));
  }, [router]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {loading ? (
        <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
          Redirecting...
        </div>
      ) : null}
    </SessionContextProvider>
  );
}
