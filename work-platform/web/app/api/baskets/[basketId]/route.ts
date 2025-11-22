/**
 * API Route: GET /api/baskets/[basketId]
 *
 * Direct database query pattern (same as Context API)
 * Provides basket metadata and stats (blocks/documents counts)
 * Queries Supabase directly to avoid substrate API auth issues
 *
 * Authentication: Uses Supabase session
 * Authorization: User must have access to workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ basketId: string }> }
) {
  try {
    const { basketId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = session.access_token;

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access required' }, { status: 403 });
    }

    console.log(`[Baskets API] Fetching basket ${basketId} for workspace ${workspace.id}`);

    // Query basket directly from Supabase (same pattern as Context API)
    // This avoids 401 errors from substrate API authentication issues
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('*')
      .eq('id', basketId)
      .single();

    if (basketError || !basket) {
      console.error(`[Baskets API] Basket not found: ${basketError?.message}`);
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Verify workspace access (basket must belong to user's workspace)
    if (basket.workspace_id !== workspace.id) {
      console.warn(
        `[Baskets API] Workspace mismatch: basket ${basketId} belongs to ${basket.workspace_id}, user is in ${workspace.id}`
      );
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Query blocks count for stats (same as Context API does)
    const { count: blocksCount, error: blocksCountError } = await supabase
      .from('blocks')
      .select('id', { count: 'exact', head: true })
      .eq('basket_id', basketId)
      .in('state', ['PROPOSED', 'ACCEPTED', 'LOCKED', 'CONSTANT']);

    // Query documents count (if documents table exists)
    const { count: documentsCount, error: documentsCountError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('basket_id', basketId);

    const basketData = {
      ...basket,
      stats: {
        blocks_count: blocksCount || 0,
        documents_count: documentsCount || 0,
      },
    };

    console.log(
      `[Baskets API] Successfully fetched basket ${basketId}: ${basketData.stats.blocks_count} blocks, ${basketData.stats.documents_count} documents`
    );

    return NextResponse.json(basketData);

  } catch (error) {
    console.error('[Baskets API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch basket' },
      { status: 500 }
    );
  }
}
