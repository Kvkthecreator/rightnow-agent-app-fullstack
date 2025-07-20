import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/dbTypes";

export async function ensureWorkspaceServer(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: membership } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membership?.workspace_id) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", membership.workspace_id)
      .single();
    return workspace ?? null;
  }

  const { data: newWorkspace, error: createError } = await supabase
    .from("workspaces")
    .insert({ name: `${user.email}'s Workspace`, owner_id: user.id })
    .select()
    .single();

  if (createError || !newWorkspace) {
    console.error("❌ Failed to create workspace:", createError);
    return null;
  }

  const { error: membershipError } = await supabase
    .from("workspace_memberships")
    .insert({
      user_id: user.id,
      workspace_id: newWorkspace.id,
      role: "owner",
    });

  if (membershipError) {
    console.error("❌ Failed to create workspace membership:", membershipError);
    return null;
  }

  return newWorkspace;
}
