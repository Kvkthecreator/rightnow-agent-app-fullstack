"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/dbTypes";

export default function EnsureWorkspace() {
  const supabase = createClientComponentClient<Database>();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setStatus("loading");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("❌ No authenticated user found.");
        setStatus("done");
        return;
      }

      const { data: membership } = await supabase
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.workspace_id) {
        setMessage(`✅ Workspace already exists: ${membership.workspace_id}`);
        setStatus("done");
        return;
      }

      // Create new workspace
      const { data: newWorkspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          owner_id: user.id,
          name: `${user.email}'s Workspace`,
        })
        .select()
        .single();

      if (wsError || !newWorkspace) {
        setMessage(`❌ Workspace creation failed: ${wsError?.message}`);
        setStatus("done");
        return;
      }

      // Create membership
      const { error: memError } = await supabase
        .from("workspace_memberships")
        .insert({
          user_id: user.id,
          workspace_id: newWorkspace.id,
          role: "owner",
        });

      if (memError) {
        setMessage(`⚠️ Created workspace but failed membership: ${memError.message}`);
      } else {
        setMessage(`✅ Workspace + membership created: ${newWorkspace.id}`);
      }

      setStatus("done");
    };

    init();
  }, []);

  return (
    <div className="text-sm text-muted-foreground border rounded-md px-4 py-3">
      <p><strong>Workspace check status:</strong></p>
      {status === "loading" ? (
        <p>Checking workspace...</p>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
