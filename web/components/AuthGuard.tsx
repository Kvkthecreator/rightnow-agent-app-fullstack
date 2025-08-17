// web/components/AuthGuard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { dlog } from "@/lib/dev/log";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  
  // StrictMode guard - prevent double execution
  const hasExecuted = useRef(false);

  useEffect(() => {
    // Skip if already executed (React StrictMode prevention)
    if (hasExecuted.current) {
      dlog('auth/guard-skip', { reason: 'already-executed' });
      return;
    }
    
    hasExecuted.current = true;
    
    const checkAuth = async () => {
      dlog('auth/guard-check', { timestamp: Date.now() });

      const { data: { user } } = await supabase.auth.getUser();

      dlog('auth/guard-result', {
        hasUser: !!user,
        userId: user?.id
      });

      if (!user) {
        dlog('auth/guard-redirect', { reason: 'no-user' });
        router.replace("/login");
        return;
      }

      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return <p className="p-4 text-muted-foreground">Checking authentication...</p>;
  }

  return <>{children}</>;
}
