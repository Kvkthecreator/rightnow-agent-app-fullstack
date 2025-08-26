import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  AttachBlockRequestSchema,
  BlockLinkSchema,
  type BlockLinkDTO,
} from '@shared/contracts/documents';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DEPRECATED: Use /documents/[id]/references API for Canon v1.3.1 compliance
// This endpoint violates substrate canon by treating blocks as special
export async function POST(request: NextRequest, ctx: RouteContext) {
  console.warn('DEPRECATED: /documents/[id]/blocks API violates substrate canon. Use /documents/[id]/references instead');
  
  try {
    const { id: documentId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = AttachBlockRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 422 }
      );
    }

    const { block_id, occurrences, snippets } = parseResult.data;

    // Validate document exists and user has access
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, basket_id, workspace_id')
      .eq('id', documentId)
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json({ error: 'document not found' }, { status: 404 });
    }

    // Check workspace access
    if (document.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // Validate block exists and belongs to same basket
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select('id, basket_id')
      .eq('id', block_id)
      .eq('basket_id', document.basket_id)
      .maybeSingle();

    if (blockError || !block) {
      return NextResponse.json({ error: 'block not found or does not belong to basket' }, { status: 404 });
    }

    // Use existing fn_document_attach_block RPC for consistency
    const { data: blockLinkId, error: attachError } = await supabase
      .rpc('fn_document_attach_block', {
        p_document_id: documentId,
        p_block_id: block_id,
        p_occurrences: occurrences || 1,
        p_snippets: snippets || [],
      });

    if (attachError) {
      return NextResponse.json(
        { error: `Failed to attach block: ${attachError.message}` },
        { status: 400 }
      );
    }

    // Emit timeline event
    await supabase.rpc('fn_timeline_emit', {
      p_basket_id: document.basket_id,
      p_kind: 'block.linked',
      p_ref_id: blockLinkId,
      p_preview: 'Linked block to document',
      p_payload: { 
        document_id: documentId, 
        block_id: block_id, 
        block_link_id: blockLinkId,
        occurrences: occurrences || 1,
      },
    });

    // Return the created block link
    const blockLink: BlockLinkDTO = {
      id: blockLinkId,
      document_id: documentId,
      block_id: block_id,
      occurrences: occurrences || 1,
      snippets: snippets || [],
    };

    const response = withSchema(BlockLinkSchema, blockLink, { status: 201 });
    response.headers.set('X-API-Deprecated', 'true');
    response.headers.set('X-API-Replacement', `/api/documents/${documentId}/references`);
    response.headers.set('X-API-Deprecation-Reason', 'Violates substrate canon - blocks not treated as peer to other substrates');
    return response;

  } catch (error) {
    console.error('Block attach error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}