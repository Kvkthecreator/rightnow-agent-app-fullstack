// File: /app/dashboard/layout.tsx

import { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/dbTypes";
import ClientLayoutWrapper from "@/components/layouts/ClientLayoutWrapper";
import { getOrCreateWorkspace } from "@/lib/workspaces";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  await getOrCreateWorkspace();

  return (
    <ClientLayoutWrapper initialSession={session}>
      {children}
    </ClientLayoutWrapper>
  );
}
