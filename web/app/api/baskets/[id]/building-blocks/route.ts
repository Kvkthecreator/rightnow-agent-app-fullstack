import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Unified substrate type for Canon compliance - All Substrates are Peers
interface UnifiedSubstrate {
  id: string;
  type: 'dump' | 'context_item' | 'block' | 'timeline_event';  // v2.0 substrate types
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
  // Structured ingredients for blocks
  structured_ingredients?: {
    goals?: any[];
    constraints?: any[];
    metrics?: any[];
    entities?: any[];
    provenance?: any;
  };
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId } = await ctx.params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace access required" }, { status: 401 });
    }

    // Canon v1.4.0: Fetch all substrate types as peers with workspace isolation
    const [rawDumpsResult, contextItemsResult, blocksResult] = await Promise.all([
      // P0 Capture Agent - Raw memory dumps
      supabase
        .from('raw_dumps')
        .select('id, body_md, processing_status, created_at, source_meta, file_url')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Foundational substrate - Context items  
      supabase
        .from('context_items')
        .select('id, type, content, created_at, metadata')
        .eq('basket_id', basketId)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // P1 Substrate Agent - Processed blocks with structured ingredients
      supabase
        .from('blocks')
        .select('id, semantic_type, content, confidence_score, title, body_md, created_at, meta_agent_notes, metadata')
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

    // Raw dumps (P0 Capture) - v2.0 substrate type 'dump'
    rawDumpsResult.data?.forEach(dump => {
      const sourceType = dump.file_url ? 'file' : 'text';
      unifiedSubstrates.push({
        id: dump.id,
        type: 'dump',  // v2.0 substrate type
        title: `${sourceType} capture`,
        content: dump.body_md || '',
        agent_stage: 'P0',
        created_at: dump.created_at,
        metadata: dump.source_meta,
        processing_agent: 'P0 Capture Agent',
        agent_confidence: 1.0, // Capture is always certain
      });
    });

    // Context items (Foundation)
    contextItemsResult.data?.forEach(item => {
      unifiedSubstrates.push({
        id: item.id,
        type: 'context_item',
        title: item.metadata?.title || `${item.type} context`,
        content: item.content || '',
        agent_stage: 'P1', // Context items are foundational substrate
        created_at: item.created_at,
        metadata: item.metadata,
        processing_agent: 'Foundation Agent',
        agent_confidence: item.metadata?.confidence_score || 0.7,
      });
    });

    // Blocks (P1 Substrate Agent)
    blocksResult.data?.forEach(block => {
      unifiedSubstrates.push({
        id: block.id,
        type: 'block',
        title: block.title || `${block.semantic_type} block`,
        content: block.body_md || block.content || '',
        agent_stage: 'P1',
        confidence_score: block.confidence_score,
        semantic_type: block.semantic_type,
        created_at: block.created_at,
        metadata: { 
          agent_notes: block.meta_agent_notes,
          ...block.metadata 
        },
        processing_agent: 'P1 Substrate Agent',
        agent_confidence: block.confidence_score,
        structured_ingredients: block.metadata?.knowledge_ingredients,
      });
    });

    // Sort by creation time (most recent first) - Equal treatment across all types
    unifiedSubstrates.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Return unified substrate view - v2.0 substrate counts
    return NextResponse.json({
      substrates: unifiedSubstrates,
      counts: {
        dumps: rawDumpsResult.data?.length || 0,        // v2.0 naming
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