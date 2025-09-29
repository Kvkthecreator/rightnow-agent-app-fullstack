import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/dbTypes";

export async function ensureWorkspaceServer(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Mirror backend behaviour: user operates in exactly one workspace keyed by owner_id
  const { data: ownedWorkspace, error: lookupError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!lookupError && ownedWorkspace) {
    return ownedWorkspace;
  }

  // Create workspace if missing
  const { data: newWorkspace, error: createError } = await supabase
    .from('workspaces')
    .insert({ name: `${user.email ?? 'Workspace'}`, owner_id: user.id })
    .select()
    .single();

  if (createError || !newWorkspace) {
    console.error('❌ Failed to create workspace:', createError);
    return null;
  }

  // Ensure membership row exists (helps other RLS checks)
  const { error: membershipError } = await supabase
    .from('workspace_memberships')
    .insert({
      user_id: user.id,
      workspace_id: newWorkspace.id,
      role: 'owner',
    });

  if (membershipError) {
    // Non-fatal; log for visibility
    console.warn('⚠️ Failed to create workspace membership:', membershipError.message);
  }

  return newWorkspace;
}
