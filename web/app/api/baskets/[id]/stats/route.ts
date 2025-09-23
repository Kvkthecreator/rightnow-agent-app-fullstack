import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { calculateMaturity, type BasketStats } from '@/lib/basket/maturity';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/baskets/[id]/stats
export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Verify basket access
    const { data: basket, error: basketErr } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (basketErr || !basket) {
      return NextResponse.json({ error: 'basket not found' }, { status: 404 });
    }
    if (basket.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Gather substrate statistics - aligned with building blocks filtering
    const [
      { count: blocks_count },
      { count: raw_dumps_count },
      { count: context_items_count }, 
      { count: timeline_events_count },
      { count: documents_count }
    ] = await Promise.all([
      supabase.from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id)
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived'),
      supabase.from('raw_dumps')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id)
        .eq('workspace_id', workspace.id)
        .neq('processing_status', 'redacted'),
      supabase.from('context_items')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id)
        .eq('state', 'ACTIVE'),
      supabase.from('timeline_events')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id),
      supabase.from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id)
        .eq('workspace_id', workspace.id)
    ]);

    const stats: BasketStats = {
      blocks_count: blocks_count || 0,
      raw_dumps_count: raw_dumps_count || 0,
      context_items_count: context_items_count || 0,
      timeline_events_count: timeline_events_count || 0,
      documents_count: documents_count || 0
    };

    // Calculate maturity
    const maturity = calculateMaturity(stats);

    return NextResponse.json({ 
      stats, 
      maturity,
      basket_id: id 
    }, { status: 200 });

  } catch (error) {
    console.error('Basket stats route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}