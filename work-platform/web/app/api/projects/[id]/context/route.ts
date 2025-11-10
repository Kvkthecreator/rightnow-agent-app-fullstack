import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

const SUBSTRATE_API_URL = process.env.SUBSTRATE_API_URL || 'http://localhost:10000';

/**
 * GET /api/projects/[id]/context
 *
 * Fetches substrate blocks (context) for a project's basket.
 * This is a BFF route that delegates to substrate-api.
 *
 * Returns:
 * - blocks: Array of substrate blocks (knowledge & meaning)
 * - stats: Block counts by category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Get Supabase session for auth
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

    // Fetch project to get basket_id
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
      return NextResponse.json(
        { detail: 'Project has no associated basket' },
        { status: 400 }
      );
    }

    // Forward request to substrate-api
    // GET /baskets/{basketId}/blocks?states=ACCEPTED,LOCKED,CONSTANT
    const substrateUrl = new URL(`${SUBSTRATE_API_URL}/baskets/${basketId}/blocks`);
    substrateUrl.searchParams.set('states', 'ACCEPTED,LOCKED,CONSTANT');
    substrateUrl.searchParams.set('limit', '200'); // Reasonable limit for context page

    const substrateResponse = await fetch(substrateUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!substrateResponse.ok) {
      const errorData = await substrateResponse.json().catch(() => ({
        detail: 'Failed to fetch substrate blocks'
      }));

      return NextResponse.json(
        {
          detail: 'Substrate API error',
          substrate_error: errorData
        },
        { status: substrateResponse.status }
      );
    }

    const substrateData = await substrateResponse.json();
    const blocks = substrateData.blocks || [];

    // Calculate stats
    const knowledgeTypes = ['knowledge', 'factual', 'metric', 'entity'];
    const meaningTypes = ['intent', 'objective', 'rationale', 'principle', 'assumption', 'context', 'constraint'];

    const stats = {
      total: blocks.length,
      knowledge: blocks.filter((b: any) =>
        knowledgeTypes.includes(b.semantic_type?.toLowerCase())
      ).length,
      meaning: blocks.filter((b: any) =>
        meaningTypes.includes(b.semantic_type?.toLowerCase())
      ).length,
    };

    return NextResponse.json({
      blocks,
      stats,
      basket_id: basketId,
    });

  } catch (error) {
    console.error('[CONTEXT API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
