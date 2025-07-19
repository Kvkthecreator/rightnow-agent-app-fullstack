import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/dbTypes";
import { getOrCreateWorkspace } from "@/lib/workspaces/getOrCreateWorkspace";
import SettingsSection from "@/components/settings/SettingsSection";
import DisplayBox from "@/components/settings/DisplayBox";

export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/settings");
  }

  const workspace = await getOrCreateWorkspace();
  const workspaceId = workspace?.id ?? null;

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "Unknown";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SettingsSection
        title="Settings"
        description="Manage your account preferences and profile details"
      >
        <DisplayBox label="UID" value={user.id} />
        <DisplayBox label="Display Name" value={displayName} />
        <DisplayBox label="Email" value={user.email ?? ""} />
        {workspaceId ? (
          <DisplayBox label="Workspace ID" value={workspaceId} />
        ) : (
          <div className="rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
            <strong>⚠️ No workspace found.</strong>
            <p className="mt-1 text-sm">
              Something went wrong with workspace setup. Please refresh the page or contact support.
            </p>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
