import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './dbTypes';

export async function getActiveWorkspaceId(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ?? null;
}
