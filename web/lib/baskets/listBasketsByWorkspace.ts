import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/dbTypes';
import { logEvent } from '@/lib/telemetry';

export type BasketSummary = Pick<
  Database['public']['Tables']['baskets']['Row'],
  'id' | 'state' | 'updated_at'
>;

export async function listBasketsByWorkspace(workspaceId: string): Promise<BasketSummary[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from('baskets')
      .select('id, state, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[listBasketsByWorkspace]', error.message);
    return [];
  }
  let baskets = data ?? [];
  if (baskets.length > 1) {
    await logEvent('basket.multiple_detected', {
      workspace_id: workspaceId,
      count: baskets.length,
      basket_ids: baskets.slice(0, 5).map((b) => b.id),
    });
    baskets = baskets.filter((b) => b.state !== 'archived');
    baskets.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }
  return baskets.slice(0, 1);
}
