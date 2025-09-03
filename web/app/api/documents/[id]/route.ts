import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  UpdateDocumentRequestSchema,
  DocumentSchema,
  DocumentCompositionSchema,
  type DocumentDTO,
  type DocumentComposition
} from '@shared/contracts/documents';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate document exists and user has access
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, basket_id, title, created_at, updated_at, metadata, workspace_id')
      .eq('id', id)
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

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateDocumentRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 422 }
      );
    }

    const { title, content_raw, metadata } = parseResult.data;

    // Validate document exists and user has access
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, basket_id, title, content_raw, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }

    // Check workspace access
    if (document.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Use existing fn_document_update RPC for consistency
    const { error: updateError } = await supabase
      .rpc('fn_document_update', {
        p_doc_id: id,
        p_title: title || null,
        p_content_raw: content_raw || null,
        p_metadata: metadata || null,
      });

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update document: ${updateError.message}` },
        { status: 400 }
      );
    }

    // Emit timeline event if title changed
    if (title !== undefined && title !== document.title) {
      await supabase.rpc('fn_timeline_emit', {
        p_basket_id: document.basket_id,
        p_kind: 'document.updated',
        p_ref_id: id,
        p_preview: `Updated document "${title}"`,
        p_payload: { document_id: id, title, metadata },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}