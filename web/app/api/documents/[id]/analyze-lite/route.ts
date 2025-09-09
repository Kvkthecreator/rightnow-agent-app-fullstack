import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/analyze-lite
export async function GET(
  request: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient() as any;
    const { userId, isTest } = await getTestAwareAuth(supabase);
    const workspace = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

    // Verify access to document
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }
    if (doc.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Fetch analyze-lite projection
    const { data: rows, error: viewErr } = await supabase
      .from('vw_document_analyze_lite')
      .select('*')
      .eq('document_id', id)
      .limit(1);

    if (viewErr) {
      console.error('Analyze-lite view error:', viewErr);
      return NextResponse.json({ error: 'Failed to fetch analyze-lite data' }, { status: 500 });
    }

    const row = rows && rows[0];
    if (!row) {
      return NextResponse.json({ error: 'No analyze data for document' }, { status: 404 });
    }

    return NextResponse.json({ analyze: row }, { status: 200 });

  } catch (error) {
    console.error('Analyze-lite route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

