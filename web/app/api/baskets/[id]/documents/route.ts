import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  GetDocumentsResponseSchema, 
  CreateDocumentRequestSchema, 
  CreateDocumentResponseSchema,
  type DocumentDTO,
  type CreateDocumentRequest 
} from '@/shared/contracts/documents';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  
  // Authentication and workspace validation
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  // Validate basket belongs to workspace
  const { data: basket, error: basketError } = await supabase
    .from('baskets')
    .select('id, workspace_id')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (basketError || !basket) {
    return NextResponse.json({ error: 'basket not found' }, { status: 404 });
  }

  // Query document heads (one row per artifact)
  const { data, error } = await supabase
    .from('document_heads')
    .select('document_id, basket_id, title, doc_type, current_version_hash, document_updated_at, latest_version_created_at, document_metadata')
    .eq('basket_id', id)
    .order('latest_version_created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Transform to DocumentDTO format
  const documents: DocumentDTO[] = (data || []).map((doc: any) => ({
    id: doc.document_id,
    basket_id: doc.basket_id,
    title: doc.title,
    doc_type: doc.doc_type,
    current_version_hash: doc.current_version_hash,
    latest_version_created_at: doc.latest_version_created_at || doc.document_updated_at,
    updated_at: doc.document_updated_at,
    metadata: doc.document_metadata || {},
  }));

  return withSchema(GetDocumentsResponseSchema, {
    documents,
    last_cursor: documents.length > 0 ? documents[documents.length - 1].updated_at : undefined,
  }, { status: 200 });
}

// POST /api/baskets/[id]/documents - Create document in basket
export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: basketId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateDocumentRequestSchema.safeParse({
      ...body,
      basket_id: basketId, // Auto-inject basket_id from URL
    });
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 422 }
      );
    }

    const { basket_id, title, metadata } = parseResult.data;

    // Validate basket belongs to workspace
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basket_id)
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'basket not found' }, { status: 404 });
    }

    // Use existing fn_document_create RPC for consistency
    const { data: documentId, error: createError } = await supabase
      .rpc('fn_document_create', {
        p_basket_id: basket_id,
        p_title: title,
        p_metadata: metadata || {},
      });

    if (createError) {
      return NextResponse.json(
        { error: `Failed to create document: ${createError.message}` },
        { status: 400 }
      );
    }

    // Emit timeline event using new emit_timeline_event function
    await supabase.rpc('emit_timeline_event', {
      p_basket_id: basket_id,
      p_event_type: 'document.created',
      p_event_data: { 
        document_id: documentId, 
        title, 
        metadata 
      },
      p_workspace_id: workspace.id,
      p_actor_id: userId,
    });

    return withSchema(CreateDocumentResponseSchema, {
      document_id: documentId,
    }, { status: 201 });

  } catch (error) {
    console.error('Document creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
