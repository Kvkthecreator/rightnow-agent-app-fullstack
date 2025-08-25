import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface BasketHeader {
  id: string;
  name: string | null;
  last_activity_ts: string | null;
  workspace_id: string;
}

export interface BasketHealth {
  dumps_count: number;
  blocks_count: number;
  context_items_count: number;
}

export interface ReflectionData {
  id: string;
  reflection_text: string;
  computation_timestamp: string;
}

export async function getBasketHeader(basketId: string): Promise<BasketHeader | null> {
  const supabase = createServerSupabaseClient();

  // Get basket info
  const { data: basket, error: basketError } = await supabase
    .from('baskets')
    .select('id, name, workspace_id')
    .eq('id', basketId)
    .single();

  if (basketError || !basket) {
    return null;
  }

  // Get last activity from timeline_events
  const { data: lastActivity, error: activityError } = await supabase
    .from('timeline_events')
    .select('ts')
    .eq('basket_id', basketId)
    .order('ts', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activityError) {
    console.error('Error fetching last activity:', activityError);
  }

  return {
    id: basket.id,
    name: basket.name,
    last_activity_ts: lastActivity?.ts || null,
    workspace_id: basket.workspace_id,
  };
}

export async function getBasketHealth(basketId: string): Promise<BasketHealth> {
  const supabase = createServerSupabaseClient();

  // Get counts in parallel
  const [
    { count: dumps_count },
    { count: blocks_count },
    { count: context_items_count },
  ] = await Promise.all([
    supabase
      .from('raw_dumps')
      .select('*', { count: 'exact', head: true })
      .eq('basket_id', basketId)
      .then(({ count }) => ({ count: count || 0 })),
    supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('basket_id', basketId)
      .then(({ count }) => ({ count: count || 0 })),
    supabase
      .from('context_items')
      .select('*', { count: 'exact', head: true })
      .eq('basket_id', basketId)
      .then(({ count }) => ({ count: count || 0 })),
  ]);

  return {
    dumps_count,
    blocks_count,
    context_items_count,
  };
}

export async function getLatestReflection(basketId: string): Promise<ReflectionData | null> {
  const supabase = createServerSupabaseClient();

  const { data: reflection, error } = await supabase
    .from('reflection_cache')
    .select('id, reflection_text, computation_timestamp')
    .eq('basket_id', basketId)
    .order('computation_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest reflection:', error);
    return null;
  }

  return reflection;
}