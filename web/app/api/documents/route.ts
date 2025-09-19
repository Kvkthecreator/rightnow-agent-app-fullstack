import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

// POST /api/documents - create a blank document (artifact-only)
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    const body = await req.json();
    const { basket_id, title, content_raw, metadata } = body || {};
    if (!basket_id || !title) {
      return NextResponse.json({ error: 'basket_id and title required' }, { status: 400 });
    }

    // Direct insert ensures workspace_id is set and avoids RPC signature mismatch
    const { data: inserted, error } = await supabase
      .from('documents')
      .insert({
        basket_id,
        workspace_id: workspace.id,
        title: String(title),
        content_raw: String(content_raw || ''),
        status: 'draft',
        document_type: 'narrative',
        metadata: {
          created_via: 'memory_page',
          ...(metadata || {})
        }
      })
      .select('id')
      .single();

    if (error || !inserted) return NextResponse.json({ error: error?.message || 'create failed' }, { status: 400 });
    return NextResponse.json({ document_id: inserted.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

// GET /api/documents?basketId=uuid&limit=20
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    const { searchParams } = new URL(req.url);
    const basketId = searchParams.get('basketId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);

    let query = supabase
      .from('documents')
      .select('id, basket_id, title, created_at, updated_at, metadata, workspace_id')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (basketId) {
      query = query.eq('basket_id', basketId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ documents: [] }, { status: 200 });

    const documents = (data || []).map((d: any) => ({
      id: d.id,
      basket_id: d.basket_id,
      title: d.title,
      created_at: d.created_at,
      updated_at: d.updated_at,
      metadata: d.metadata || {},
    }));

    return NextResponse.json({ documents }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
