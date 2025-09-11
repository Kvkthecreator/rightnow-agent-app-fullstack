export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ReflectionEngine } from '@/lib/server/ReflectionEngine';
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

    const engine = new ReflectionEngine();
    const result = await engine.getDocumentReflections(document_id, doc.workspace_id, cursor || undefined, limit);
    return withSchema(GetReflectionsResponseSchema, result, { status: 200 });
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

    const engine = new ReflectionEngine();
    const reflection = await engine.computeDocumentReflection(document_id, doc.workspace_id, {});
    return NextResponse.json({ success: true, reflection }, { status: 200 });
  } catch (error) {
    console.error('Document reflections POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
