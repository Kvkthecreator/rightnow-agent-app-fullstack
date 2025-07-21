import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';

export async function getBasket(
  supabase: SupabaseClient<Database>,
  id: string,
  workspaceId: string,
) {
  return supabase
    .from('baskets')
    .select('id, name, status, created_at')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();
}
