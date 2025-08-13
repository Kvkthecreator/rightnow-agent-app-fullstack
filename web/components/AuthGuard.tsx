// web/components/AuthGuard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import { dlog } from "@/lib/dev/log";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
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
      
      const { data: { session }, error } = await supabase.auth.getSession();

      dlog('auth/guard-result', { 
        hasSession: !!session, 
        hasError: !!error,
        sessionId: session?.user?.id 
      });

      if (!session || error) {
        dlog('auth/guard-redirect', { reason: 'no-session-or-error' });
        router.replace("/login");
        return;
      }

      setSession(session);
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return <p className="p-4 text-muted-foreground">Checking authentication...</p>;
  }

  return <>{children}</>;
}
