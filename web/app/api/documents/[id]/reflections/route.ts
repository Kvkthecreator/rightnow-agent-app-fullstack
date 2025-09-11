export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
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
    const supabase = createRouteHandlerClient({ cookies: () => req.headers.get('cookie') ?? '' as any });
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

    const backend = process.env.BACKEND_URL;
    if (!backend) return NextResponse.json({ error: 'backend_url_missing' }, { status: 500 });
    const resp = await fetch(`${backend}/api/reflections/documents/${document_id}?workspace_id=${doc.workspace_id}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    const data = await resp.json();
    return withSchema(GetReflectionsResponseSchema, data, { status: resp.status });
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
    const supabase = createRouteHandlerClient({ cookies: () => req.headers.get('cookie') ?? '' as any });
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

    const backend = process.env.BACKEND_URL;
    if (!backend) return NextResponse.json({ error: 'backend_url_missing' }, { status: 500 });
    const resp = await fetch(`${backend}/api/reflections/documents/${document_id}/compute?workspace_id=${doc.workspace_id}`, { method: 'POST' });
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
