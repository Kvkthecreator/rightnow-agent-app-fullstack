// API Bridge: Frontend Next.js → Backend Manager Agent
// This is the critical missing link between the two systems

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z, ZodError } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest, 
  context: RouteContext
) {
  try {
    const { id: basketId } = await context.params;
    const reqId = request.headers.get('X-Req-Id') || `ui-${Date.now()}`;
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Support both new mode format and legacy format
    const hasMode =
      typeof body === 'object' && body !== null && 'mode' in body;
    
    let parsed: any;
    if (hasMode) {
      // New BasketWorkRequest format
      const NewSchema = z.object({
        mode: z.enum(['init_build', 'evolve_turn']),
        sources: z.array(
          z.object({
            type: z.string(),
            id: z.string(),
            content: z.string().optional()
          })
        ).min(1, 'sources must include at least one item'),
        policy: z.object({
          allow_structural_changes: z.boolean().optional(),
          preserve_blocks: z.array(z.string()).optional(),
          update_document_ids: z.array(z.string()).optional(),
          strict_link_provenance: z.boolean().optional()
        }).optional(),
        options: z.object({
          fast: z.boolean().optional(),
          max_tokens: z.number().optional(),
          trace_req_id: z.string().optional()
        }).optional()
      });
      parsed = NewSchema.parse(body);
    } else {
      // Legacy BasketChangeRequest format
      const LegacySchema = z.object({
        request_id: z.string(),
        basket_id: z.string().uuid(),
        intent: z.string().optional(),
        sources: z.array(z.object({ type: z.string(), id: z.string().optional() })).optional(),
      });
      parsed = LegacySchema.parse(body);
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error('baskets/work unauthorized', { reqId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId =
      (session.user?.app_metadata as any)?.workspace_id ||
      (session.user?.user_metadata as any)?.workspace_id ||
      null;

    const backendUrl = process.env.API_BASE ?? 'https://api.yarnnn.com';
    const endpoint = `${backendUrl}/api/baskets/${basketId}/work`;

    console.log('🌉 API Bridge: Proxying to backend:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(workspaceId ? { 'X-Workspace-Id': String(workspaceId) } : {}),
        'X-Req-Id': reqId,
      },
      body: JSON.stringify(parsed),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Backend Manager Agent failed:', response.status, text.slice(0, 500));
      return NextResponse.json(
        { error: text || `Manager Agent failed (${response.status})` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Manager Agent response:', { deltaId: result.delta_id, changes: result.changes?.length });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('❌ API Bridge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'API bridge failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// Also handle GET for testing
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: basketId } = await context.params;
  
  return NextResponse.json({
    bridge: 'active',
    basketId,
    backendUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com',
    message: 'API bridge is working. Use POST to send basket work requests.'
  });
}