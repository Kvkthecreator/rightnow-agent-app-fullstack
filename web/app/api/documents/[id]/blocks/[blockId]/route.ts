import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string; blockId: string }>;
}

// DEPRECATED: Use /documents/[id]/references API for Canon v1.3.1 compliance
// This endpoint violates substrate canon by treating blocks as special
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  console.warn('DEPRECATED: /documents/[id]/blocks/[blockId] API violates substrate canon. Use /documents/[id]/references instead');
  
  try {
    const { id: documentId, blockId } = await ctx.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

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

    // Find the block link to delete
    const { data: blockLink, error: linkError } = await supabase
      .from('block_links')
      .select('id')
      .eq('document_id', documentId)
      .eq('block_id', blockId)
      .maybeSingle();

    if (linkError || !blockLink) {
      return NextResponse.json({ error: 'block link not found' }, { status: 404 });
    }

    // Delete the block link
    const { error: deleteError } = await supabase
      .from('block_links')
      .delete()
      .eq('id', blockLink.id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to detach block: ${deleteError.message}` },
        { status: 400 }
      );
    }

    // Emit timeline event
    await supabase.rpc('fn_timeline_emit', {
      p_basket_id: document.basket_id,
      p_kind: 'block.unlinked',
      p_ref_id: blockLink.id,
      p_preview: 'Unlinked block from document',
      p_payload: { 
        document_id: documentId, 
        block_id: blockId, 
        block_link_id: blockLink.id,
      },
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set('X-API-Deprecated', 'true');
    response.headers.set('X-API-Replacement', `/api/documents/${documentId}/references?substrate_type=block&substrate_id=${blockId}`);
    response.headers.set('X-API-Deprecation-Reason', 'Violates substrate canon - blocks not treated as peer to other substrates');
    return response;

  } catch (error) {
    console.error('Block detach error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}