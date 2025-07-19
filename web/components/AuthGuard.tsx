// web/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/dbTypes";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const supabase = createPagesBrowserClient<Database>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      console.info("🟡 Checking session in AuthGuard:", session, error);

      if (!session || error) {
        console.warn("🔒 No session found. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      setSession(session);
      setChecking(false);
    };

    checkAuth();
  }, []);

  if (checking) {
    return <p className="p-4 text-muted-foreground">Checking authentication...</p>;
  }

  return <>{children}</>;
}
