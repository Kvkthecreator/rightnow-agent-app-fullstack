import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import AuthGuard from "@/components/AuthGuard";
import type { Database } from "@/lib/dbTypes";

export default async function HomePage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);

  if (!workspace) {
    return (
      <div className="p-6 text-red-600">
        ❌ Workspace creation failed. Please try again or contact support.
      </div>
    );
  }

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
