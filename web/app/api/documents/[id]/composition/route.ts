import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Load document with current version content (Canon v3.0)
    const { data: doc, error: docErr } = await supabase
      .from('document_heads')
      .select('document_id, basket_id, title, content, document_created_at, document_updated_at, workspace_id, document_metadata')
      .eq('document_id', id)
      .maybeSingle();
    if (docErr || !doc) return NextResponse.json({ error: 'document not found' }, { status: 404 });
    if (doc.workspace_id !== workspace.id) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

    // Stats (composition)
    const { data: stats } = await supabase
      .from('document_composition_stats')
      .select('*')
      .eq('document_id', id)
      .maybeSingle();

    // References
    const { data: refs } = await supabase
      .from('substrate_references')
      .select('id, substrate_type, substrate_id, role, weight, snippets, metadata, created_at, created_by')
      .eq('document_id', id)
      .order('created_at', { ascending: true });

    // Resolve each reference by type (simple fan-out)
    const resolved = [] as any[];
    for (const r of refs || []) {
      let substrate: any = null;
      if (r.substrate_type === 'block') {
        const { data } = await supabase.from('blocks').select('id, title, created_at').eq('id', r.substrate_id).maybeSingle();
        substrate = { ...data, substrate_type: 'block', preview: data?.title };
      } else if (r.substrate_type === 'dump') {
        const { data } = await supabase.from('raw_dumps').select('id, created_at, text_dump').eq('id', r.substrate_id).maybeSingle();
        substrate = { ...data, substrate_type: 'dump', preview: (data?.text_dump || '').slice(0, 120) };
      } else if (r.substrate_type === 'context_item') {
        const { data } = await supabase.from('context_items').select('id, title, content, created_at').eq('id', r.substrate_id).maybeSingle();
        substrate = { ...data, substrate_type: 'context_item', preview: data?.title || data?.content };
      } else if (r.substrate_type === 'timeline_event') {
        // Timeline events not uuid-keyed here; skip detailed resolve
        substrate = { id: r.substrate_id, substrate_type: 'timeline_event', created_at: null, preview: 'timeline ref' };
      }
      resolved.push({ reference: r, substrate });
    }

    // Enhance with Phase 1 metrics if available (Canon v3.0: map view fields to expected names)
    const enhanced_doc = {
      id: doc.document_id,
      basket_id: doc.basket_id,
      title: doc.title,
      content_raw: doc.content, // Maintain backward compat field name for UI
      created_at: doc.document_created_at,
      updated_at: doc.document_updated_at,
      workspace_id: doc.workspace_id,
      metadata: {
        ...doc.document_metadata,
        // Include Phase 1 metrics from document metadata if available
        phase1_metrics: doc.document_metadata?.phase1_metrics || null
      }
    };

    const payload = {
      document: enhanced_doc,
      references: resolved,
      composition_stats: stats || {
        document_id: id,
        blocks_count: 0,
        dumps_count: 0,
        context_items_count: 0,
        timeline_events_count: 0,
        total_substrate_references: (refs || []).length
      }
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

