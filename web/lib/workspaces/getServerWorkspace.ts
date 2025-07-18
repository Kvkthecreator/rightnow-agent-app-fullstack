import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/dbTypes";

export async function getServerWorkspace() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Step 1: Try to find any workspace the user is a member of
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membershipError || !membership?.workspace_id) {
    // Step 2: If no membership exists, create a new workspace and membership
    const { data: newWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ name: "My Workspace" })
      .select()
      .single();

    if (workspaceError || !newWorkspace?.id) {
      console.error("❌ Failed to auto-create workspace:", workspaceError?.message);
      return null;
    }

    const { error: membershipInsertError } = await supabase
      .from("workspace_memberships")
      .insert({
        user_id: user.id,
        workspace_id: newWorkspace.id,
        role: "owner",
      });

    if (membershipInsertError) {
      console.error("❌ Failed to create membership:", membershipInsertError.message);
      return null;
    }

    return newWorkspace;
  }

  // Step 3: Fetch full workspace info via membership
  const { data: workspace, error: workspaceFetchError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", membership.workspace_id)
    .single();

  if (workspaceFetchError || !workspace) {
    console.error("❌ Failed to fetch workspace via membership:", workspaceFetchError?.message);
    return null;
  }

  return workspace;
}
