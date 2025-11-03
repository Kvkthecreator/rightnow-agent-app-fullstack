"use client";

import type { ReactNode } from "react";
import { createBrowserClient } from "@/lib/supabase/clients";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { Database } from "@/lib/dbTypes";

const supabase = createBrowserClient();

export default function ClientLayoutWrapper({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: any; // You can replace with Session | null if typed
}) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
