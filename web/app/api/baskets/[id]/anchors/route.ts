import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { listAnchorsWithStatus, insertCustomAnchor } from '@/lib/anchors';

const createPayloadSchema = z.object({
  label: z.string().min(2),
  expected_type: z.enum(['block', 'context_item']).default('block'),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { id: basketId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 403 });
  }

  try {
    const anchors = await listAnchorsWithStatus(supabase, basketId);
    return NextResponse.json({ anchors });
  } catch (error) {
    console.error('[anchors] list failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[anchors] error details:', errorMessage);
    return NextResponse.json({
      error: 'failed_to_load_anchors',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { id: basketId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const anchorKey = `custom-${randomUUID()}`;

  try {
    await insertCustomAnchor(supabase, basketId, anchorKey, {
      label: payload.label,
      scope: 'custom',
      expected_type: payload.expected_type,
      description: payload.description,
      required: payload.required ?? false,
      metadata: {},
    });

    const anchors = await listAnchorsWithStatus(supabase, basketId);
    return NextResponse.json({ anchors }, { status: 201 });
  } catch (error) {
    console.error('[anchors] create failed', error);
    return NextResponse.json({ error: 'failed_to_create_anchor' }, { status: 500 });
  }
}
