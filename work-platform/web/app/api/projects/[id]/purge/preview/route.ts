import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:10000';

/**
 * GET /api/projects/[id]/purge/preview
 *
 * Preview basket purge counts before execution.
 * Delegates to substrate-api GET /api/baskets/{basketId}/purge/preview
 *
 * Returns:
 * - blocks: number (unarchived blocks count)
 * - dumps: number (non-redacted dumps count)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[PURGE PREVIEW API] Request for project ${projectId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[PURGE PREVIEW API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = session.access_token;

    // Fetch project to get basket_id
    const projectResponse = await supabase
      .from('projects')
      .select('id, basket_id, user_id')
      .eq('id', projectId)
      .single();

    if (projectResponse.error || !projectResponse.data) {
      return NextResponse.json(
        { detail: 'Project not found' },
        { status: 404 }
      );
    }

    const { basket_id: basketId, user_id: projectOwnerId } = projectResponse.data;

    // Verify ownership
    if (projectOwnerId !== session.user.id) {
      console.warn('[PURGE PREVIEW API] Access denied:', {
        userId: session.user.id,
        projectOwnerId,
      });
      return NextResponse.json(
        { detail: 'Access denied' },
        { status: 403 }
      );
    }

    if (!basketId) {
      return NextResponse.json(
        { detail: 'Project has no associated basket' },
        { status: 400 }
      );
    }

    console.log(`[PURGE PREVIEW API] Fetching preview for basket ${basketId}`);

    // Forward to substrate-api
    const substrateUrl = `${SUBSTRATE_API_URL}/api/baskets/${basketId}/purge/preview`;
    const substrateResponse = await fetch(substrateUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[PURGE PREVIEW API] Substrate response status: ${substrateResponse.status}`);

    if (!substrateResponse.ok) {
      const errorData = await substrateResponse.json().catch(() => ({
        detail: 'Failed to fetch purge preview',
      }));

      console.error('[PURGE PREVIEW API] Substrate error:', substrateResponse.status, errorData);

      return NextResponse.json(
        {
          detail: 'Substrate API error',
          substrate_error: errorData,
        },
        { status: substrateResponse.status }
      );
    }

    const result = await substrateResponse.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PURGE PREVIEW API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
