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
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[CONTEXT API] Request for project ${projectId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[CONTEXT API] Auth error:', authError, 'Session:', session);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[CONTEXT API] Auth successful, user:', session.user.id);
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
      console.error('[CONTEXT API] No basket_id for project:', projectId);
      return NextResponse.json(
        { detail: 'Project has no associated basket' },
        { status: 400 }
      );
    }

    console.log(`[CONTEXT API] Fetching blocks for basket ${basketId}`);

    // Forward request to substrate-api
    // GET /api/baskets/{basketId}/blocks?states=PROPOSED,ACCEPTED,LOCKED,CONSTANT
    // Include PROPOSED blocks so users can see pending context that needs review
    const substrateUrl = new URL(`${SUBSTRATE_API_URL}/api/baskets/${basketId}/blocks`);
    substrateUrl.searchParams.set('states', 'PROPOSED,ACCEPTED,LOCKED,CONSTANT');
    substrateUrl.searchParams.set('limit', '200'); // Reasonable limit for context page

    console.log(`[CONTEXT API] Calling substrate-api: ${substrateUrl.toString()}`);

    const substrateResponse = await fetch(substrateUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[CONTEXT API] Substrate response status: ${substrateResponse.status}`);

    if (!substrateResponse.ok) {
      const errorData = await substrateResponse.json().catch(() => ({
        detail: 'Failed to fetch substrate blocks'
      }));

      console.error('[CONTEXT API] Substrate error:', substrateResponse.status, errorData);

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

/**
 * POST /api/projects/[id]/context
 *
 * Submits new context (text/files) to substrate-api for P0-P4 processing.
 * This is a BFF route that delegates to substrate-api's dump endpoints.
 *
 * Payload (multipart/form-data):
 * - basket_id: UUID
 * - project_id: UUID
 * - text_dump?: string
 * - files?: File[]
 * - dump_request_id: UUID (for idempotency)
 * - meta: JSON string with client_ts and ingest_trace_id
 *
 * Returns:
 * - success: boolean
 * - route: "direct" | "proposal" (governance routing)
 * - dump_id: string
 * - message: string
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[CONTEXT API POST] Request for project ${projectId}`);

    // Get Supabase session for auth
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[CONTEXT API POST] Auth error:', authError);
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[CONTEXT API POST] Auth successful, user:', session.user.id);
    const token = session.access_token;

    // Parse multipart form data
    const formData = await request.formData();
    const basketId = formData.get('basket_id') as string;
    const textDump = formData.get('text_dump') as string | null;
    const files = formData.getAll('files') as File[];
    const dumpRequestId = formData.get('dump_request_id') as string;
    const metaJson = formData.get('meta') as string;

    if (!basketId) {
      return NextResponse.json(
        { detail: 'basket_id is required' },
        { status: 400 }
      );
    }

    console.log(`[CONTEXT API POST] Basket: ${basketId}, Text: ${!!textDump}, Files: ${files.length}`);

    // Verify project owns this basket
    const projectResponse = await supabase
      .from('projects')
      .select('id, basket_id')
      .eq('id', projectId)
      .single();

    if (projectResponse.error || !projectResponse.data) {
      return NextResponse.json(
        { detail: 'Project not found' },
        { status: 404 }
      );
    }

    if (projectResponse.data.basket_id !== basketId) {
      return NextResponse.json(
        { detail: 'Basket does not belong to this project' },
        { status: 403 }
      );
    }

    // Decide which substrate-api endpoint to use
    const hasFiles = files.length > 0;
    const endpoint = hasFiles ? '/api/dumps/upload' : '/api/dumps/new';
    const substrateUrl = `${SUBSTRATE_API_URL}${endpoint}`;

    console.log(`[CONTEXT API POST] Forwarding to substrate-api: ${endpoint}`);

    // Prepare request to substrate-api
    let substrateResponse: Response;

    if (hasFiles) {
      // Use multipart/form-data for file uploads
      const substrateFormData = new FormData();
      substrateFormData.append('basket_id', basketId);
      if (textDump) {
        substrateFormData.append('text_dump', textDump);
      }
      substrateFormData.append('dump_request_id', dumpRequestId);
      substrateFormData.append('meta', metaJson);

      // Append all files
      files.forEach((file) => {
        substrateFormData.append('files', file);
      });

      substrateResponse = await fetch(substrateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: substrateFormData,
      });
    } else {
      // Use JSON for text-only submissions
      const meta = JSON.parse(metaJson);

      substrateResponse = await fetch(substrateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basket_id: basketId,
          text_dump: textDump,
          dump_request_id: dumpRequestId,
          meta,
        }),
      });
    }

    console.log(`[CONTEXT API POST] Substrate response status: ${substrateResponse.status}`);

    if (!substrateResponse.ok) {
      const errorData = await substrateResponse.json().catch(() => ({
        detail: 'Failed to submit context to substrate-api'
      }));

      console.error('[CONTEXT API POST] Substrate error:', substrateResponse.status, errorData);

      return NextResponse.json(
        {
          detail: 'Substrate API error',
          substrate_error: errorData
        },
        { status: substrateResponse.status }
      );
    }

    const result = await substrateResponse.json();

    console.log(`[CONTEXT API POST] Success: route=${result.route}, dump_id=${result.dump_id}`);

    return NextResponse.json(result, { status: substrateResponse.status });

  } catch (error) {
    console.error('[CONTEXT API POST] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
