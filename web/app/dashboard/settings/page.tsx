import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/dbTypes";

import SettingsSection from "@/components/settings/SettingsSection";
import DisplayBox from "@/components/settings/DisplayBox";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/settings");
  }

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "Unknown";

  const workspace = await ensureWorkspaceServer(supabase);
  const workspaceId = workspace?.id ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SettingsSection
        title="Settings"
        description="Manage your account preferences and profile details"
      >
        <DisplayBox label="UID" value={user.id} />
        <DisplayBox label="Display Name" value={displayName} />
        <DisplayBox label="Email" value={user.email ?? "Unknown"} />

        {workspaceId ? (
          <DisplayBox label="Workspace ID" value={workspaceId} />
        ) : (
          <div className="rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
            <strong>⚠️ Workspace creation failed</strong>
            <p className="mt-1 text-sm">
              We couldn’t create your workspace. Please try again later or contact support.
            </p>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
