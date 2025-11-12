import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

/**
 * GET /api/projects/[id]/context/[blockId]
 *
 * Fetches a single substrate block's details for display in the modal.
 * This is a BFF route that queries the database directly.
 *
 * Returns:
 * - Block details with all metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const { id: projectId, blockId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[CONTEXT BLOCK API] Request for project ${projectId}, block ${blockId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[CONTEXT BLOCK API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[CONTEXT BLOCK API] Auth successful, user:', session.user.id);

    // Fetch project to verify access and get basket_id
    const projectResponse = await supabase
      .from('projects')
      .select('id, basket_id, name')
      .eq('id', projectId)
      .single();

    if (projectResponse.error || !projectResponse.data) {
      return NextResponse.json(
        { detail: 'Project not found' },
        { status: 404 }
      );
    }

    const { basket_id: basketId } = projectResponse.data;

    if (!basketId) {
      console.error('[CONTEXT BLOCK API] No basket_id for project:', projectId);
      return NextResponse.json(
        { detail: 'Project has no associated basket' },
        { status: 400 }
      );
    }

    console.log(`[CONTEXT BLOCK API] Fetching block ${blockId} for basket ${basketId}`);

    // Query single block from database
    const { data: blockData, error: blockError } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', blockId)
      .eq('basket_id', basketId)
      .single();

    if (blockError || !blockData) {
      console.error('[CONTEXT BLOCK API] Block not found:', blockError);
      return NextResponse.json(
        { detail: 'Block not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`[CONTEXT BLOCK API] Found block ${blockId}`);

    return NextResponse.json(blockData);

  } catch (error) {
    console.error('[CONTEXT BLOCK API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
