import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DerivedBlock {
  id: string;
  title: string | null;
  semantic_type: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at?: string | null;
  state?: string | null;
  metadata?: Record<string, any> | null;
  source_dump_id?: string | null;
}

interface DerivedContextItem {
  id: string;
  title: string | null;
  semantic_category: string | null;
  semantic_meaning: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
  source_dump_id?: string | null;
}

interface WorkItemSummary {
  work_id: string;
  work_type: string;
  status: string | null;
  created_at: string;
}

interface CaptureSummary {
  dump: {
    id: string;
    body_md: string | null;
    file_url: string | null;
    processing_status: string | null;
    created_at: string;
    source_meta: Record<string, any> | null;
  };
  derived_blocks: DerivedBlock[];
  derived_context_items: DerivedContextItem[];
  work_items: WorkItemSummary[];
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

    // Canon v1.4.0: Fetch all substrate types as peers with workspace isolation
    const [rawDumpsResult, contextItemsResult, blocksResult] = await Promise.all([
      // P0 Capture Agent - Raw memory dumps
      supabase
        .from('raw_dumps')
        .select('id, body_md, processing_status, created_at, source_meta, file_url')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .neq('processing_status', 'redacted')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Foundational substrate - Context items  
      supabase
        .from('context_items')
        .select('id, type, content, created_at, metadata, status, state, title, raw_dump_id, semantic_meaning, semantic_category')
        .eq('basket_id', basketId)
        .eq('state', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // P1 Substrate Agent - Processed blocks with structured ingredients
      supabase
        .from('blocks')
        .select('id, semantic_type, content, confidence_score, title, body_md, created_at, updated_at, meta_agent_notes, metadata, status, raw_dump_id')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
        .neq('status', 'archived')
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

    const rawDumps = rawDumpsResult.data ?? [];
    const blocks = blocksResult.data ?? [];
    const contextItems = contextItemsResult.data ?? [];

    const dumpMap = new Map<string, CaptureSummary>();

    rawDumps.forEach(dump => {
      dumpMap.set(dump.id, {
        dump: {
          id: dump.id,
          body_md: dump.body_md || null,
          file_url: dump.file_url || null,
          processing_status: dump.processing_status || null,
          created_at: dump.created_at,
          source_meta: dump.source_meta || null
        },
        derived_blocks: [],
        derived_context_items: [],
        work_items: []
      });
    });

    const orphanBlocks: DerivedBlock[] = [];
    const orphanContextItems: DerivedContextItem[] = [];

    const unwrapBlock = (block: any): DerivedBlock => ({
      id: block.id,
      title: block.title || null,
      semantic_type: block.semantic_type || null,
      confidence_score: block.confidence_score ?? null,
      created_at: block.created_at,
      updated_at: block.updated_at ?? null,
      state: block.status ?? block.state ?? null,
      metadata: block.metadata || null,
      source_dump_id: block.raw_dump_id || null,
    });

    blocks.forEach(block => {
      const target = block.raw_dump_id ? dumpMap.get(block.raw_dump_id) : undefined;
      if (target) {
        target.derived_blocks.push(unwrapBlock(block));
      } else {
        orphanBlocks.push(unwrapBlock(block));
      }
    });

    const unwrapContextItem = (item: any): DerivedContextItem => ({
      id: item.id,
      title: item.title || item.metadata?.title || null,
      semantic_category: item.semantic_category || item.type || null,
      semantic_meaning: item.semantic_meaning || null,
      created_at: item.created_at,
      metadata: item.metadata || null,
      source_dump_id: item.raw_dump_id || null,
    });

    contextItems.forEach(item => {
      const target = item.raw_dump_id ? dumpMap.get(item.raw_dump_id) : undefined;
      if (target) {
        target.derived_context_items.push(unwrapContextItem(item));
      } else {
        orphanContextItems.push(unwrapContextItem(item));
      }
    });

    // Fetch work orchestration entries for the basket to provide pipeline visibility
    const dumpIds = rawDumps.map(d => d.id);
    let workItemsData: any[] = [];
    if (dumpIds.length > 0) {
      const { data: workItems, error: workError } = await supabase
        .from('agent_processing_queue')
        .select('work_id, work_type, processing_state, created_at, dump_id, work_payload, basket_id')
        .eq('workspace_id', workspace.id)
        .eq('basket_id', basketId)
        .order('created_at', { ascending: true });

      if (workError) {
        console.error('Work queue query error:', workError);
      } else if (workItems) {
        workItemsData = workItems;
      }
    }

    const dumpIdSet = new Set(dumpIds);

    const appendWorkItem = (dumpId: string, payload: WorkItemSummary) => {
      const capture = dumpMap.get(dumpId);
      if (capture) {
        capture.work_items.push(payload);
      }
    };

    const extractDumpIdsFromWork = (work: any): string[] => {
      const ids: string[] = [];
      if (work.dump_id && dumpIdSet.has(work.dump_id)) {
        ids.push(work.dump_id);
      }
      const payload = work.work_payload || {};
      const candidates = [
        payload.dump_id,
        payload.source_dump_id,
        payload.raw_dump_id,
      ].filter(Boolean);

      candidates.forEach((id: string) => {
        if (dumpIdSet.has(id)) ids.push(id);
      });

      const arrayCandidates = [
        payload.dump_ids,
        payload.raw_dump_ids,
        payload.source_dump_ids,
      ];

      arrayCandidates.forEach((list: string[] | undefined) => {
        if (Array.isArray(list)) {
          list.forEach(id => {
            if (dumpIdSet.has(id)) ids.push(id);
          });
        }
      });

      return Array.from(new Set(ids));
    };

    workItemsData.forEach(work => {
      const relatedDumpIds = extractDumpIdsFromWork(work);
      if (!relatedDumpIds.length) return;

      const summary: WorkItemSummary = {
        work_id: work.work_id,
        work_type: work.work_type,
        status: work.processing_state,
        created_at: work.created_at
      };

      relatedDumpIds.forEach(dumpId => appendWorkItem(dumpId, summary));
    });

    const captures: CaptureSummary[] = Array.from(dumpMap.values()).sort((a, b) =>
      new Date(b.dump.created_at).getTime() - new Date(a.dump.created_at).getTime()
    );

    const stats = {
      captures: captures.length,
      dumps: rawDumps.length,
      blocks: blocks.length,
      context_items: contextItems.length
    };

    return NextResponse.json({
      captures,
      stats,
      orphans: {
        blocks: orphanBlocks,
        context_items: orphanContextItems
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
