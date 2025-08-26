import { createServerSupabaseClient } from '@/lib/supabase/server';

/** Check if user has any content or identity genesis marker */
export async function isFirstEverUser(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient() as any;

  // Check for identity_genesis marker
  const { count: markerCount } = await supabase
    .from('context_items')
    .select('id', { count: 'exact', head: true })
    .eq('context_type', 'system')
    .eq('content_text', 'identity_genesis')
    .eq('created_by', userId);

  if ((markerCount ?? 0) > 0) return false;

  // Check for any dumps, documents or blocks created by user
  const [{ count: dumpCount }, { count: docCount }, { count: blockCount }] = await Promise.all([
    supabase.from('raw_dumps').select('id', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('blocks').select('id', { count: 'exact', head: true }).eq('created_by', userId),
  ]);

  return (dumpCount ?? 0) === 0 && (docCount ?? 0) === 0 && (blockCount ?? 0) === 0;
}

/** Check if basket has any dumps, documents or blocks */
export async function isBlankBasket(basketId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient() as any;
  const [{ count: dumpCount }, { count: docCount }, { count: blockCount }] = await Promise.all([
    supabase.from('raw_dumps').select('id', { count: 'exact', head: true }).eq('basket_id', basketId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('basket_id', basketId),
    supabase.from('blocks').select('id', { count: 'exact', head: true }).eq('basket_id', basketId),
  ]);
  return (dumpCount ?? 0) === 0 && (docCount ?? 0) === 0 && (blockCount ?? 0) === 0;
}

/** Check if basket already has identity genesis marker */
export async function hasIdentityGenesis(basketId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient() as any;
  const { count } = await supabase
    .from('context_items')
    .select('id', { count: 'exact', head: true })
    .eq('basket_id', basketId)
    .eq('context_type', 'system')
    .eq('content_text', 'identity_genesis');
  return (count ?? 0) > 0;
}
