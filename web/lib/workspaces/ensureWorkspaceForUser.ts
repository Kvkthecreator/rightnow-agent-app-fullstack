import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/dbTypes'

export async function ensureWorkspaceForUser(userId: string, supabase: SupabaseClient<Database>) {
  const { data: membership } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membership?.workspace_id) return { id: membership.workspace_id }

  const { data: workspace, error: workspaceErr } = await supabase
    .from('workspaces')
    .insert({ owner_id: userId, name: 'Default Workspace' })
    .select('id')
    .single()
  if (workspaceErr || !workspace) throw workspaceErr ?? new Error('Failed to create workspace')

  const { error: membershipErr } = await supabase
    .from('workspace_memberships')
    .insert({ user_id: userId, workspace_id: workspace.id, role: 'owner' })
  if (membershipErr) throw membershipErr

  return { id: workspace.id }
}
