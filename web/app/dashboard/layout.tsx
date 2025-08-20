// File: /app/dashboard/layout.tsx

import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/dbTypes";
import ClientLayoutWrapper from "@/components/layouts/ClientLayoutWrapper";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <ClientLayoutWrapper initialSession={session}>
      {children}
    </ClientLayoutWrapper>
  );
}
