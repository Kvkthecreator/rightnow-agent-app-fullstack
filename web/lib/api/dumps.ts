import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';

export async function getLatestDump(
  supabase: SupabaseClient<Database>,
  basketId: string,
  workspaceId: string,
  documentId?: string,
) {
  const query = supabase
    .from('raw_dumps')
    .select('body_md, document_id')
    .eq('basket_id', basketId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (documentId) {
    query.eq('document_id', documentId);
  }
  return query.maybeSingle();
}
