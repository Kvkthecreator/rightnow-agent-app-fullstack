"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserClient } from "@/lib/supabase/clients";
import { useState } from "react";
import type { Database } from "@/lib/dbTypes";

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() =>
    createBrowserClient(),
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}
