import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './dbTypes'

export async function getOrCreateWorkspaceId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  console.debug("[Workspace] Creating or retrieving workspace for user:", userId)
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.workspace_id) return existing.workspace_id

  const { data: created, error } = await supabase
    .from('workspaces')
    .insert({ name: 'My Workspace' })
    .select('id')
    .single()

  if (error || !created?.id) throw new Error('Failed to create workspace')

  await supabase.from('workspace_members').insert({
    workspace_id: created.id,
    user_id: userId,
    role: 'owner',
  })

  return created.id
}
