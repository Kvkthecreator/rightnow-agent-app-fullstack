import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/dbTypes';

export type BasketSummary = Pick<
  Database['public']['Tables']['baskets']['Row'],
  'id' | 'status' | 'updated_at'
>;

export async function listBasketsByWorkspace(workspaceId: string): Promise<BasketSummary[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from('baskets')
    .select('id, status, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[listBasketsByWorkspace]', error.message);
    return [];
  }
  return data ?? [];
}
