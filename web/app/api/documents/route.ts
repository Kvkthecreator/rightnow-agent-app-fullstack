import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  CreateDocumentRequestSchema, 
  CreateDocumentResponseSchema,
  type CreateDocumentRequest,
} from '@shared/contracts/documents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');
    
    if (!basketId) {
      return NextResponse.json({ error: 'basketId required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basketId)
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'basket not found' }, { status: 404 });
    }

    // Fetch documents for basket
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, document_type, created_at, updated_at')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      return NextResponse.json(
        { error: `Failed to fetch documents: ${documentsError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ documents: documents || [] });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateDocumentRequestSchema.safeParse(body);
    
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

    // Use existing fn_document_create RPC with proper parameters
    const { data: documentId, error: createError } = await supabase
      .rpc('fn_document_create', {
        p_basket_id: basket_id,
        p_title: title,
        p_content_raw: '',
        p_document_type: 'narrative',
        p_metadata: metadata || {},
      });

    if (createError) {
      return NextResponse.json(
        { error: `Failed to create document: ${createError.message}` },
        { status: 400 }
      );
    }

    // Emit timeline event
    await supabase.rpc('fn_timeline_emit', {
      p_basket_id: basket_id,
      p_kind: 'document.created',
      p_ref_id: documentId,
      p_preview: `Created document "${title}"`,
      p_payload: { document_id: documentId, title, metadata },
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