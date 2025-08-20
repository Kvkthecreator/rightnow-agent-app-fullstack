"use client";

import type { ReactNode } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { Database } from "@/lib/dbTypes";

const supabase = createPagesBrowserClient<Database>();

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
