import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Building Blocks API - Substrate Management
 *
 * Canon-compliant substrate retrieval with context-aware quality metrics.
 *
 * Returns:
 * - Blocks with usage tracking (usefulness_score, times_referenced)
 * - Blocks with staleness detection (staleness_days from last_validated_at)
 * - Context items with semantic meaning
 * - Stats for filtering (anchored, stale, unused counts)
 *
 * NOTE: Raw dumps are NOT included here - they belong in /uploads page
 */

interface BlockWithMetrics {
  id: string;
  title: string | null;
  content: string | null;
  semantic_type: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at?: string | null;
  status: string | null;
  metadata?: Record<string, any> | null;
  raw_dump_id?: string | null;

  // NEW: Context-aware quality metrics
  usefulness_score: number;
  times_referenced: number;
  staleness_days: number | null;
  last_validated_at: string | null;
}

interface ContextItemWithMetrics {
  id: string;
  title: string | null;
  semantic_category: string | null;
  semantic_meaning: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
}

interface BuildingBlocksStats {
  total_blocks: number;
  total_context_items: number;
  anchored_blocks: number;
  stale_blocks: number;
  unused_blocks: number;
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest
      ? { id: '00000000-0000-0000-0000-000000000002' }
      : await ensureWorkspaceForUser(userId, supabase);

    // Canon v2.1: Fetch substrate types with context-aware metrics
    // Fetch blocks first (without block_usage join to avoid RLS issues)
    const { data: blocksData, error: blocksError } = await supabase
      .from('blocks')
      .select(`
        id,
        semantic_type,
        content,
        confidence_score,
        title,
        created_at,
        updated_at,
        metadata,
        status,
        raw_dump_id,
        last_validated_at
      `)
      .eq('basket_id', basketId)
      .eq('workspace_id', workspace.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(200);

    if (blocksError) {
      console.error('Blocks query error:', blocksError);
      return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
    }

    // Fetch block usage separately and join in application code
    // This avoids RLS issues with nested selects
    const blockIds = (blocksData ?? []).map(b => b.id);
    const { data: usageData } = await supabase
      .from('block_usage')
      .select('block_id, times_referenced, usefulness_score, last_used_at')
      .in('block_id', blockIds);

    // Create usage lookup map
    const usageMap = new Map(
      (usageData ?? []).map(u => [u.block_id, u])
    );

    // Context items with semantic meaning
    const { data: contextItemsData, error: contextItemsError } = await supabase
      .from('context_items')
      .select('id, title, semantic_meaning, semantic_category, created_at, metadata, status, state')
      .eq('basket_id', basketId)
      .eq('state', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(200);

    if (contextItemsError) {
      console.error('Context items query error:', contextItemsError);
      return NextResponse.json({ error: 'Failed to fetch context items' }, { status: 500 });
    }

    // Transform blocks with quality metrics
    const blocks: BlockWithMetrics[] = (blocksData ?? []).map(block => {
      const usage = usageMap.get(block.id);

      // Calculate staleness_days from last_validated_at
      let staleness_days: number | null = null;
      if (block.last_validated_at) {
        const lastValidated = new Date(block.last_validated_at);
        const now = new Date();
        const diffMs = now.getTime() - lastValidated.getTime();
        staleness_days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        id: block.id,
        title: block.title || null,
        content: block.content || null,
        semantic_type: block.semantic_type || null,
        confidence_score: block.confidence_score ?? null,
        created_at: block.created_at,
        updated_at: block.updated_at ?? null,
        status: block.status ?? null,
        metadata: block.metadata || null,
        raw_dump_id: block.raw_dump_id || null,

        // Context-aware quality metrics
        usefulness_score: usage?.usefulness_score ?? 0.0,
        times_referenced: usage?.times_referenced ?? 0,
        staleness_days,
        last_validated_at: block.last_validated_at,
      };
    });

    // Transform context items
    const contextItems: ContextItemWithMetrics[] = (contextItemsData ?? []).map(item => ({
      id: item.id,
      title: item.title || null,
      semantic_category: item.semantic_category || null,
      semantic_meaning: item.semantic_meaning || null,
      created_at: item.created_at,
      metadata: item.metadata || null,
    }));

    // Calculate stats for filtering
    const stale_blocks = blocks.filter(b => b.staleness_days !== null && b.staleness_days > 30).length;
    const unused_blocks = blocks.filter(b => b.times_referenced === 0).length;

    // Note: anchored_blocks count requires anchor registry query (done in client via separate endpoint)

    const stats: BuildingBlocksStats = {
      total_blocks: blocks.length,
      total_context_items: contextItems.length,
      anchored_blocks: 0, // Calculated client-side from anchors endpoint
      stale_blocks,
      unused_blocks,
    };

    return NextResponse.json({
      blocks,
      context_items: contextItems,
      stats,
    }, { status: 200 });

  } catch (error) {
    console.error('Building blocks fetch error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
