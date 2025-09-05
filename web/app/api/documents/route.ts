import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  CreateDocumentRequestSchema, 
  CreateDocumentResponseSchema,
  type CreateDocumentRequest,
} from '@/shared/contracts/documents';

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

    // Fetch documents for basket with workspace filter for RLS
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, document_type, created_at, updated_at, workspace_id')
      .eq('basket_id', basketId)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Documents query error:', documentsError);
      return NextResponse.json(
        { error: `Failed to fetch documents: ${documentsError.message}` },
        { status: 400 }
      );
    }

    console.log(`Documents API: Found ${documents?.length || 0} documents for basket ${basketId} in workspace ${workspace.id}`);
    
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

    // Direct insert since fn_document_create has workspace_id issues
    const { data: documentData, error: createError } = await supabase
      .from('documents')
      .insert({
        basket_id: basket_id,
        workspace_id: workspace.id,
        title: title,
        content_raw: '',
        document_type: 'narrative',
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (createError) {
      return NextResponse.json(
        { error: `Failed to create document: ${createError.message}` },
        { status: 400 }
      );
    }

    const documentId = documentData.id;

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