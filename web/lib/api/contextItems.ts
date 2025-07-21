import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';

export async function getContextItems(
  supabase: SupabaseClient<Database>,
  basketId: string,
  documentId: string | null,
  workspaceId: string,
) {
  return supabase
    .from('context_items')
    .select('id, content')
    .eq('basket_id', basketId)
    .eq('document_id', documentId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');
}
