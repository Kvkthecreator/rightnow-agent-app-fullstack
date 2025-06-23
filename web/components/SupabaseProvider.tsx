"use client";

import { ReactNode, useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * SupabaseProvider wraps the app with SessionContextProvider for Supabase auth.
 */
export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabaseClient] = useState(() => supabase);
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}