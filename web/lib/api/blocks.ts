import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';

export async function getBlocks(
  supabase: SupabaseClient<Database>,
  basketId: string,
  workspaceId: string,
) {
  return supabase
    .from('blocks')
    .select('id, semantic_type, content, state, scope, canonical_value, actor, created_at')
    .eq('basket_id', basketId)
    .eq('workspace_id', workspaceId)
    .in('state', ['LOCKED', 'PROPOSED', 'CONSTANT']);
}
