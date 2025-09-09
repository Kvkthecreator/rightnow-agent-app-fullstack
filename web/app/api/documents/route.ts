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
    const { basket_id, title, content_raw } = body || {};
    if (!basket_id || !title) {
      return NextResponse.json({ error: 'basket_id and title required' }, { status: 400 });
    }

    const { data: docId, error } = await supabase.rpc('fn_document_create', {
      p_basket_id: basket_id,
      p_title: String(title),
      p_content_raw: String(content_raw || ''),
      p_document_type: 'narrative',
      p_metadata: { origin: 'blank_create' }
    });
    if (error || !docId) return NextResponse.json({ error: 'create failed' }, { status: 400 });
    return NextResponse.json({ document_id: docId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

