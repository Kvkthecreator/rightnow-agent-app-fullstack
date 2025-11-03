import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { listAnchorsWithStatus, upsertAnchorRegistryRow, archiveAnchor, getAnchorRecord } from '@/lib/anchors';

const updateSchema = z.object({
  label: z.string().min(2).optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  ordering: z.number().int().optional(),
  expected_type: z.enum(['block', 'context_item']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; anchorId: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { id: basketId, anchorId } = await params;

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

  const record = await getAnchorRecord(supabase, basketId, anchorId);
  if (!record) {
    return NextResponse.json({ error: 'anchor_not_found' }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const updates = parsed.data;
  if (updates.expected_type && record.scope !== 'custom' && updates.expected_type !== record.expected_type) {
    return NextResponse.json({ error: 'expected_type_locked' }, { status: 400 });
  }

  try {
    await upsertAnchorRegistryRow(supabase, basketId, anchorId, {
      label: updates.label ?? record.label,
      description: updates.description ?? record.description ?? undefined,
      required: typeof updates.required === 'boolean' ? updates.required : record.required,
      ordering: typeof updates.ordering === 'number' ? updates.ordering : record.ordering,
      expected_type: updates.expected_type ?? record.expected_type,
    });

    const anchors = await listAnchorsWithStatus(supabase, basketId);
    return NextResponse.json({ anchors });
  } catch (error) {
    console.error('[anchor] update failed', error);
    return NextResponse.json({ error: 'failed_to_update_anchor' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; anchorId: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { id: basketId, anchorId } = await params;

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

  const record = await getAnchorRecord(supabase, basketId, anchorId);
  if (!record) {
    return NextResponse.json({ error: 'anchor_not_found' }, { status: 404 });
  }

  if (record.scope !== 'custom') {
    return NextResponse.json({ error: 'cannot_archive_system_anchor' }, { status: 403 });
  }

  try {
    await archiveAnchor(supabase, basketId, anchorId);
    const anchors = await listAnchorsWithStatus(supabase, basketId);
    return NextResponse.json({ anchors });
  } catch (error) {
    console.error('[anchor] delete failed', error);
    return NextResponse.json({ error: 'failed_to_archive_anchor' }, { status: 500 });
  }
}
