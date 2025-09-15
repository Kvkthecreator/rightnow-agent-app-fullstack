export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext { params: Promise<{ basketId: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { basketId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify access
    const { data: basket, error: bErr } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basketId)
      .maybeSingle();
    if (bErr || !basket || basket.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'not_found_or_forbidden' }, { status: 404 });
    }

    // Unreferenced blocks (not archived)
    const { data: unrefBlocks, error: ubErr } = await supabase
      .rpc('sql', { // use postgrest query; fallback to left join via JS if rpc not available
        // no-op
      } as any);
    // Fallback query with left join semantics
    const { data: blocks } = await supabase
      .from('blocks')
      .select('id, title, created_at, confidence_score, status')
      .eq('basket_id', basketId)
      .neq('status', 'archived')
      .limit(200);
    const unrefBlockIds: string[] = [];
    if (blocks && blocks.length > 0) {
      for (const b of blocks) {
        const { count } = await supabase
          .from('substrate_references')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', null as unknown as string) // trick to avoid selection
          .eq('substrate_type', 'block')
          .eq('substrate_id', b.id);
        // If count is undefined, do a second approach
        const { data: refs } = await supabase
          .from('substrate_references')
          .select('id')
          .eq('substrate_type', 'block')
          .eq('substrate_id', b.id)
          .limit(1);
        if (!refs || refs.length === 0) unrefBlockIds.push(b.id);
      }
    }

    // Unreferenced context_items (not archived)
    const { data: items } = await supabase
      .from('context_items')
      .select('id, title, created_at, status')
      .eq('basket_id', basketId)
      .neq('status', 'archived')
      .limit(200);
    const unrefItemIds: string[] = [];
    if (items && items.length > 0) {
      for (const ci of items) {
        const { data: refs } = await supabase
          .from('substrate_references')
          .select('id')
          .eq('substrate_type', 'context_item')
          .eq('substrate_id', ci.id)
          .limit(1);
        if (!refs || refs.length === 0) unrefItemIds.push(ci.id);
      }
    }

    // Dumps eligible for redaction (not already redacted)
    const { data: dumps } = await supabase
      .from('raw_dumps')
      .select('id, created_at, processing_status')
      .eq('basket_id', basketId)
      .neq('processing_status', 'redacted')
      .limit(100);
    const candidateDumpIds = (dumps || []).map(d => d.id);

    // Cascade preview for top N candidates
    const limitN = 10;
    const preview = async (type: 'block'|'dump', id: string) => {
      const { data, error } = await supabase.rpc('fn_cascade_preview', {
        p_basket_id: basketId,
        p_substrate_type: type,
        p_substrate_id: id
      });
      if (error) return { refs_detached_count: 0, relationships_pruned_count: 0, affected_documents_count: 0 };
      return data || { refs_detached_count: 0, relationships_pruned_count: 0, affected_documents_count: 0 };
    };

    const blocksPreview = [] as any[];
    for (const id of unrefBlockIds.slice(0, limitN)) {
      blocksPreview.push({ id, preview: await preview('block', id) });
    }
    const dumpsPreview = [] as any[];
    for (const id of candidateDumpIds.slice(0, limitN)) {
      dumpsPreview.push({ id, preview: await preview('dump', id) });
    }

    return NextResponse.json({
      candidates: {
        blocks_to_archive: blocksPreview,
        context_items_to_deprecate: unrefItemIds.slice(0, limitN),
        dumps_to_redact: dumpsPreview
      }
    }, { status: 200 });
  } catch (e) {
    console.error('Maintenance suggestion error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

