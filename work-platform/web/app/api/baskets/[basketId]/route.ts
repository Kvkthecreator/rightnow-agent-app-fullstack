/**
 * API Route: GET /api/baskets/[basketId]
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

// Point to substrate-api's Next.js web layer (port 10000), NOT Python backend (8001)
const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:10000';

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

    // Call substrate-api (user token, not service secret)
    // Substrate-api uses /api prefix for all routes
    const substrateResponse = await fetch(
      `${SUBSTRATE_API_URL}/api/baskets/${basketId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
