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
    const { data: row, error } = await supabase
      .from('documents')
      .select('id, basket_id, title, content_raw, created_at, updated_at, metadata, workspace_id')
      .eq('id', id)
      .maybeSingle();
    if (error || !row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (row.workspace_id !== workspace.id) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    return NextResponse.json(row, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Verify ownership
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, workspace_id')
      .eq('id', id)
      .maybeSingle();
    if (docErr || !doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (doc.workspace_id !== workspace.id) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

    const patch: any = {};
    if (typeof body.title === 'string') patch.title = body.title;
    if (typeof body.content_raw === 'string') patch.content_raw = body.content_raw;
    patch.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('documents')
      .update(patch)
      .eq('id', id)
      .select('id, title, content_raw, updated_at')
      .single();
    if (error) return NextResponse.json({ error: 'update failed' }, { status: 400 });
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

