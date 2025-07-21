import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';

export async function getDocuments(
  supabase: SupabaseClient<Database>,
  basketId: string,
  workspaceId: string,
) {
  return supabase
    .from('documents')
    .select('id, title')
    .eq('basket_id', basketId)
    .eq('workspace_id', workspaceId);
}
