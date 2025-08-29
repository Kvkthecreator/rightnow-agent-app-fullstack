import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Unified substrate type for Canon compliance - All Substrates are Peers
interface UnifiedSubstrate {
  id: string;
  type: 'raw_dump' | 'context_item' | 'block';
  title: string;
  content: string;
  agent_stage: 'P0' | 'P1' | 'P2' | 'P3';
  agent_type?: string;
  confidence_score?: number;
  semantic_type?: string;
  created_at: string;
  metadata: any;
  // Agent attribution for Canon compliance
  processing_agent?: string;
  agent_confidence?: number;
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Canon v1.4.0: Fetch all substrate types as peers with workspace isolation
    const [rawDumpsResult, contextItemsResult, blocksResult] = await Promise.all([
      // P0 Capture Agent - Raw memory dumps
      supabase
        .from('raw_dumps')
        .select('id, body_md, source_type, created_at, metadata, char_count')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Foundational substrate - Context items
      supabase
        .from('context_items')
        .select('id, type, title, description, content_text, created_at, metadata, is_validated')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // P1 Substrate Agent - Processed blocks
      supabase
        .from('blocks')
        .select('id, semantic_type, content, confidence_score, agent_type, created_at, metadata')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Check for errors
    if (rawDumpsResult.error) {
      console.error('Raw dumps query error:', rawDumpsResult.error);
      return NextResponse.json({ error: 'Failed to fetch raw dumps' }, { status: 500 });
    }
    if (contextItemsResult.error) {
      console.error('Context items query error:', contextItemsResult.error);
      return NextResponse.json({ error: 'Failed to fetch context items' }, { status: 500 });
    }
    if (blocksResult.error) {
      console.error('Blocks query error:', blocksResult.error);
      return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
    }

    // Transform all substrate types to unified format - Canon compliance: Equal treatment
    const unifiedSubstrates: UnifiedSubstrate[] = [];

    // Raw dumps (P0 Capture)
    rawDumpsResult.data?.forEach(dump => {
      unifiedSubstrates.push({
        id: dump.id,
        type: 'raw_dump',
        title: `${dump.source_type} capture`,
        content: dump.body_md || '',
        agent_stage: 'P0',
        created_at: dump.created_at,
        metadata: dump.metadata,
        processing_agent: 'P0 Capture Agent',
        agent_confidence: 1.0, // Capture is always certain
      });
    });

    // Context items (Foundation)
    contextItemsResult.data?.forEach(item => {
      unifiedSubstrates.push({
        id: item.id,
        type: 'context_item',
        title: item.title || `${item.type} context`,
        content: item.content_text || item.description || '',
        agent_stage: 'P1', // Context items are foundational substrate
        created_at: item.created_at,
        metadata: item.metadata,
        processing_agent: 'Foundation Agent',
        agent_confidence: item.is_validated ? 1.0 : 0.7,
      });
    });

    // Blocks (P1 Substrate Agent)
    blocksResult.data?.forEach(block => {
      unifiedSubstrates.push({
        id: block.id,
        type: 'block',
        title: `${block.semantic_type} block`,
        content: block.content || '',
        agent_stage: 'P1',
        agent_type: block.agent_type,
        confidence_score: block.confidence_score,
        semantic_type: block.semantic_type,
        created_at: block.created_at,
        metadata: block.metadata,
        processing_agent: block.agent_type || 'P1 Substrate Agent',
        agent_confidence: block.confidence_score,
      });
    });

    // Sort by creation time (most recent first) - Equal treatment across all types
    unifiedSubstrates.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Return unified substrate view
    return NextResponse.json({
      substrates: unifiedSubstrates,
      counts: {
        raw_dumps: rawDumpsResult.data?.length || 0,
        context_items: contextItemsResult.data?.length || 0,
        blocks: blocksResult.data?.length || 0,
        total: unifiedSubstrates.length
      }
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