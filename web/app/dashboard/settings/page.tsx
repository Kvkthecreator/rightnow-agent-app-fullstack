import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/dbTypes";

import SettingsSection from "@/components/settings/SettingsSection";
import DisplayBox from "@/components/settings/DisplayBox";
import EnsureWorkspace from "@/lib/workspaces/EnsureWorkspace";

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SettingsSection
        title="Settings"
        description="Manage your account preferences and profile details"
      >
        <DisplayBox label="UID" value={user.id} />
        <DisplayBox label="Display Name" value={displayName} />
        <DisplayBox label="Email" value={user.email ?? ""} />

        {/* Dynamically checks/creates workspace and shows result */}
        <EnsureWorkspace />
      </SettingsSection>
    </div>
  );
}
