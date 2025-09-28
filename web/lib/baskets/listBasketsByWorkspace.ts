import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { BasketMode } from '@/shared/contracts/baskets'

export type BasketRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  mode: BasketMode;
}

export async function listBasketsByWorkspace(workspaceId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('baskets')
    .select('id,status,created_at,mode')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  return { data: (data as BasketRow[]) ?? [], error }
}
