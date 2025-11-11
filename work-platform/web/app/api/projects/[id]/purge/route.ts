import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:10000';

/**
 * POST /api/projects/[id]/purge
 *
 * Execute basket purge operation (archive blocks and/or redact dumps).
 * Delegates to substrate-api POST /api/baskets/{basketId}/purge
 *
 * Request Body:
 * - mode: 'archive_all' | 'redact_dumps'
 * - confirmation_text: string (must match project name)
 *
 * Returns:
 * - success: boolean
 * - executed_batches: number
 * - total_operations: number
 * - totals: { archivedBlocks, redactedDumps, deprecatedItems, errors }
 * - chunks: Array<{ work_id, counts, errors }>
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[PURGE API] Request for project ${projectId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[PURGE API] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = session.access_token;

    // Parse request body
    const body = await request.json();
    const { mode, confirmation_text } = body;

    if (!mode || !confirmation_text) {
      return NextResponse.json(
        { detail: 'mode and confirmation_text are required' },
        { status: 400 }
      );
    }

    if (!['archive_all', 'redact_dumps'].includes(mode)) {
      return NextResponse.json(
        { detail: 'Invalid mode. Must be "archive_all" or "redact_dumps"' },
        { status: 400 }
      );
    }

    // Fetch project to get basket_id and verify ownership
    const projectResponse = await supabase
      .from('projects')
      .select('id, name, basket_id, user_id')
      .eq('id', projectId)
      .single();

    if (projectResponse.error || !projectResponse.data) {
      return NextResponse.json(
        { detail: 'Project not found' },
        { status: 404 }
      );
    }

    const {
      name: projectName,
      basket_id: basketId,
      user_id: projectOwnerId,
    } = projectResponse.data;

    // Verify ownership
    if (projectOwnerId !== session.user.id) {
      console.warn('[PURGE API] Access denied:', {
        userId: session.user.id,
        projectOwnerId,
      });
      return NextResponse.json(
        { detail: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify confirmation text matches project name
    if (confirmation_text !== projectName) {
      return NextResponse.json(
        { detail: 'Confirmation text does not match project name' },
        { status: 400 }
      );
    }

    if (!basketId) {
      return NextResponse.json(
        { detail: 'Project has no associated basket' },
        { status: 400 }
      );
    }

    console.log(`[PURGE API] Executing ${mode} purge for basket ${basketId}`);

    // Forward to substrate-api
    const substrateUrl = `${SUBSTRATE_API_URL}/api/baskets/${basketId}/purge`;
    const substrateResponse = await fetch(substrateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode,
        confirmation_text: basketId, // substrate-api expects basket_id as confirmation
      }),
    });

    console.log(`[PURGE API] Substrate response status: ${substrateResponse.status}`);

    if (!substrateResponse.ok) {
      const errorData = await substrateResponse.json().catch(() => ({
        detail: 'Failed to execute purge',
      }));

      console.error('[PURGE API] Substrate error:', substrateResponse.status, errorData);

      return NextResponse.json(
        {
          detail: 'Substrate API error',
          substrate_error: errorData,
        },
        { status: substrateResponse.status }
      );
    }

    const result = await substrateResponse.json();

    console.log(
      `[PURGE API] Success: ${result.total_operations} operations, ${result.executed_batches} batches`
    );

    // Add user-friendly message
    const message =
      mode === 'archive_all'
        ? `Successfully archived ${result.totals?.archivedBlocks || 0} blocks and redacted ${result.totals?.redactedDumps || 0} dumps`
        : `Successfully redacted ${result.totals?.redactedDumps || 0} dumps`;

    return NextResponse.json({
      ...result,
      message,
    });
  } catch (error) {
    console.error('[PURGE API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
