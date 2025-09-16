export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { routeWork } from '@/lib/governance/universalWorkRouter';

type Mode = 'archive_all' | 'redact_dumps' | 'hard_purge';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode: Mode = body.mode;
    const confirmation_text: string = body.confirmation_text || '';
    if (!mode) return NextResponse.json({ error: 'mode required' }, { status: 422 });

    const supabase = createRouteHandlerClient({ cookies: (await import('next/headers')).cookies });
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: basket_id } = await params;

    // Load basket and verify name for confirmation
    const { data: basket } = await supabase
      .from('baskets').select('id,name,workspace_id').eq('id', basket_id).single();
    if (!basket || basket.workspace_id !== workspace.id) return NextResponse.json({ error: 'not_found_or_forbidden' }, { status: 404 });
    if (confirmation_text !== (basket.name || 'Untitled Basket')) return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });

    // Admin role check can be added here if needed (owner/admin only)

    // Collect IDs to operate on
    const [blocksRes, itemsRes, dumpsRes] = await Promise.all([
      supabase.from('blocks').select('id').eq('basket_id', basket_id).eq('workspace_id', workspace.id).neq('status','archived'),
      supabase.from('context_items').select('id,status').eq('basket_id', basket_id).neq('status','archived'),
      supabase.from('raw_dumps').select('id,processing_status').eq('basket_id', basket_id).eq('workspace_id', workspace.id).neq('processing_status','redacted')
    ]);
    const blockIds: string[] = (blocksRes.data || []).map((r:any)=>r.id);
    const itemIds: string[] = (itemsRes.data || []).map((r:any)=>r.id);
    const dumpIds: string[] = (dumpsRes.data || []).map((r:any)=>r.id);

    // Build operations per mode
    const ops: any[] = [];
    if (mode === 'archive_all') {
      blockIds.forEach(id => ops.push({ type: 'ArchiveBlock', data: { block_id: id } }));
      itemIds.forEach(id => ops.push({ type: 'Delete', data: { target_id: id, target_type: 'context_item', delete_reason: 'purge_basket' } }));
      dumpIds.forEach(id => ops.push({ type: 'RedactDump', data: { dump_id: id, scope: 'full', reason: 'purge_basket' } }));
    } else if (mode === 'redact_dumps') {
      dumpIds.forEach(id => ops.push({ type: 'RedactDump', data: { dump_id: id, scope: 'full', reason: 'purge_basket' } }));
    } else if (mode === 'hard_purge') {
      // Not exposed yet; respect retention policy and admin guard
      return NextResponse.json({ error: 'hard_purge_disabled' }, { status: 400 });
    }

    // Chunk and execute via /api/work (routeWork)
    const BATCH_SIZE = 50;
    let executed_batches = 0;
    let total_ops = 0;
    for (let i=0; i<ops.length; i+=BATCH_SIZE) {
      const chunk = ops.slice(i, i+BATCH_SIZE);
      await routeWork(supabase as any, {
        work_type: 'MANUAL_EDIT',
        work_payload: {
          operations: chunk,
          basket_id,
          provenance: ['purge_basket']
        },
        workspace_id: workspace.id,
        user_id: 'current',
        priority: 'normal'
      });
      executed_batches++;
      total_ops += chunk.length;
    }

    return NextResponse.json({ success: true, executed_batches, total_operations: total_ops });
  } catch (e) {
    console.error('Purge execute error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

