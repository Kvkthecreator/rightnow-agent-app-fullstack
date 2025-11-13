import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:10000';

/**
 * POST /api/baskets/[basketId]/assets/[assetId]/signed-url
 * Get signed download URL for asset (proxy to substrate-API)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ basketId: string; assetId: string }> }
) {
  try {
    const { basketId, assetId } = await params;

    // Get Supabase session
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = session.access_token;

    // Parse request body for expires_in parameter
    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expires_in || 3600; // Default 1 hour

    // Forward to substrate-API
    const backendResponse = await fetch(
      `${SUBSTRATE_API_URL}/api/substrate/baskets/${basketId}/assets/${assetId}/signed-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ expires_in: expiresIn }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        detail: 'Failed to generate signed URL',
      }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SIGNED URL API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
