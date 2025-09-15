export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { basket_id, substrate_type, substrate_id } = body || {};

    if (!basket_id || !substrate_type || !substrate_id) {
      return NextResponse.json({ error: 'basket_id, substrate_type, substrate_id required' }, { status: 422 });
    }

    // Validate substrate_type
    const validTypes = new Set(['block','dump','context_item','timeline_event']);
    if (!validTypes.has(String(substrate_type))) {
      return NextResponse.json({ error: 'invalid substrate_type' }, { status: 422 });
    }

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Verify basket access
    const { data: basket, error: bErr } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basket_id)
      .maybeSingle();
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
    if (!basket || basket.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'not_found_or_forbidden' }, { status: 404 });
    }

    // Cascade preview via RPC
    const { data, error } = await supabase.rpc('fn_cascade_preview', {
      p_basket_id: basket_id,
      p_substrate_type: substrate_type,
      p_substrate_id: substrate_id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ preview: data || { refs_detached_count: 0, relationships_pruned_count: 0, affected_documents_count: 0 } }, { status: 200 });
  } catch (error) {
    console.error('Cascade preview error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

