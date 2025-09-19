export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { withSchema } from '@/lib/api/withSchema';
import { GetReflectionsResponseSchema } from '@/shared/contracts/reflections';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: document_id } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    // Load document + verify workspace membership
    const { data: doc, error: dErr } = await supabase
      .from('documents')
      .select('id, basket_id, workspace_id')
      .eq('id', document_id)
      .single();
    if (dErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const { data: membership, error: mErr } = await supabase
      .from('workspace_memberships')
      .select('id')
      .eq('workspace_id', doc.workspace_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = Number(url.searchParams.get('limit') || 10);

    const { getApiBaseUrl } = await import('@/lib/config/api');
    const backend = getApiBaseUrl();
    const authHeader = req.headers.get('authorization') || undefined;
    const resp = await fetch(`${backend}/api/reflections/documents/${document_id}?workspace_id=${doc.workspace_id}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}` , {
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
      },
    });
    const contentType = resp.headers.get('content-type') || '';
    let payload: any;
    if (contentType.includes('application/json')) {
      payload = await resp.json();
    } else {
      const text = await resp.text();
      try { payload = JSON.parse(text); } catch { payload = { error: 'Upstream error', details: text }; }
    }

    if (!resp.ok) {
      return NextResponse.json(payload, { status: resp.status });
    }

    const sanitized = (() => {
      try {
        const reflections = Array.isArray((payload as any)?.reflections)
          ? (payload as any).reflections.map((r: any) => ({
              id: r.id,
              basket_id: r.basket_id,
              workspace_id: r.workspace_id,
              reflection_text: r.reflection_text,
              substrate_hash: r.substrate_hash,
              computation_timestamp: r.computation_timestamp,
              reflection_target_type: r.reflection_target_type,
              reflection_target_id: r.reflection_target_id,
              reflection_target_version: r.reflection_target_version,
              substrate_window_start: r.substrate_window_start,
              substrate_window_end: r.substrate_window_end,
              meta: r.meta,
            }))
          : [];
        const next_cursor = (payload as any)?.next_cursor ?? undefined;
        return {
          reflections,
          has_more: Boolean((payload as any)?.has_more),
          ...(next_cursor ? { next_cursor } : {}),
        };
      } catch {
        return payload as any;
      }
    })();

    return withSchema(GetReflectionsResponseSchema, sanitized, { status: resp.status });
  } catch (error) {
    console.error('Document reflections GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: document_id } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = await getAuthenticatedUser(supabase);

    // Load document + verify workspace membership
    const { data: doc, error: dErr } = await supabase
      .from('documents')
      .select('id, basket_id, workspace_id')
      .eq('id', document_id)
      .single();
    if (dErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const { data: membership, error: mErr } = await supabase
      .from('workspace_memberships')
      .select('id')
      .eq('workspace_id', doc.workspace_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { getApiBaseUrl } = await import('@/lib/config/api');
    const backend = getApiBaseUrl();
    const authHeader = req.headers.get('authorization') || undefined;
    const resp = await fetch(`${backend}/api/reflections/documents/${document_id}/compute?workspace_id=${doc.workspace_id}`, { method: 'POST', headers: { ...(authHeader ? { authorization: authHeader } : {}) } });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Document reflections POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
