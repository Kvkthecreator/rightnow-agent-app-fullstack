import { ensureWorkspaceServer } from "@/lib/workspaces";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/dbTypes";
import AuthGuard from "@/components/AuthGuard";

export default async function HomePage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  await ensureWorkspaceServer(supabase);
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">👋 Welcome back</h1>
        <p className="text-muted-foreground">
          Use the sidebar to select or create a basket to get started.
        </p>
      </div>
    </AuthGuard>
  );
}
