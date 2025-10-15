import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export interface BasketStats {
  blocks_count: number;
  raw_dumps_count: number;
  relationships_count: number;  // V3.1: Changed from context_items_count
  documents_count: number;
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

    // V3.1: Get block IDs for relationship counting
    const { data: blocks } = await supabase.from('blocks')
      .select('id')
      .eq('basket_id', id)
      .eq('workspace_id', workspace.id)
      .neq('status', 'archived');

    const blockIds = (blocks || []).map((b: any) => b.id);

    // Gather substrate statistics - V3.0/V3.1 aligned
    const [
      { count: blocks_count },
      { count: raw_dumps_count },
      { count: relationships_count },
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
      // V3.1: Count relationships for this basket's blocks
      blockIds.length > 0
        ? supabase.from('substrate_relationships')
            .select('*', { count: 'exact', head: true })
            .or(`from_block_id.in.(${blockIds.join(',')}),to_block_id.in.(${blockIds.join(',')})`)
        : Promise.resolve({ count: 0 }),
      supabase.from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', id)
        .eq('workspace_id', workspace.id)
    ]);

    const stats: BasketStats = {
      blocks_count: blocks_count || 0,
      raw_dumps_count: raw_dumps_count || 0,
      relationships_count: relationships_count || 0,
      documents_count: documents_count || 0
    };

    return NextResponse.json({
      stats,
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
