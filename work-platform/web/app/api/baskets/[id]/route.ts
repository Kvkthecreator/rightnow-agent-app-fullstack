/**
 * API Route: GET /api/baskets/[id]
 *
 * BFF pattern: Proxy to substrate-api for basket details
 * This route provides basket metadata and stats (blocks/documents counts)
 *
 * Authentication: Uses Supabase session
 * Authorization: User must have access to workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';

const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:8001';
const SUBSTRATE_SERVICE_SECRET = process.env.SUBSTRATE_SERVICE_SECRET;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: basketId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access required' }, { status: 403 });
    }

    console.log(`[Baskets API] Fetching basket ${basketId} for workspace ${workspace.id}`);

    // Call substrate-api with service-to-service authentication
    const substrateResponse = await fetch(
      `${SUBSTRATE_API_URL}/api/baskets/${basketId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUBSTRATE_SERVICE_SECRET}`,
          'X-Service-Name': 'work-platform',
        },
      }
    );

    if (!substrateResponse.ok) {
      const errorText = await substrateResponse.text();
      console.error(`[Baskets API] Substrate API error: ${substrateResponse.status} ${errorText}`);

      if (substrateResponse.status === 404) {
        return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch basket from substrate' },
        { status: substrateResponse.status }
      );
    }

    const basketData = await substrateResponse.json();

    // Verify workspace access (basket must belong to user's workspace)
    if (basketData.workspace_id !== workspace.id) {
      console.warn(
        `[Baskets API] Workspace mismatch: basket ${basketId} belongs to ${basketData.workspace_id}, user is in ${workspace.id}`
      );
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
