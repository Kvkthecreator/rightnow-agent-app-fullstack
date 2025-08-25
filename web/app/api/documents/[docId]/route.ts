import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { DocumentSchema, type DocumentDTO } from '@shared/contracts/documents';

interface RouteContext {
  params: Promise<{ docId: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
) {
  try {
    const { docId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate document exists and user has access
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, basket_id, title, created_at, updated_at, metadata, workspace_id')
      .eq('id', docId)
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }

    // Check workspace access
    if (document.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Transform to DocumentDTO format
    const documentDto: DocumentDTO = {
      id: document.id,
      basket_id: document.basket_id,
      title: document.title,
      created_at: document.created_at,
      updated_at: document.updated_at,
      metadata: document.metadata || {},
    };

    return withSchema(DocumentSchema, documentDto, { status: 200 });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
