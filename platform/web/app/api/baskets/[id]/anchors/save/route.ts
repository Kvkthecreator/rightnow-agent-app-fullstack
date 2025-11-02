import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { getAnchorRecord, linkAnchorToSubstrate, listAnchorsWithStatus } from '@/lib/anchors';
import { routeChange } from '@/lib/governance/decisionGateway';
import { buildAnchorChangeDescriptor, fetchAnchorSubstrate, countAnchorRelationships } from '@/lib/anchors/mutationHelpers';

const payloadSchema = z.object({
  anchor_id: z.string().min(1),
  content: z.string().min(1),
  title: z.string().trim().optional(),
  revision_reason: z.string().optional(),
});

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
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const anchorRecord = await getAnchorRecord(supabase, basketId, payload.anchor_id);
  if (!anchorRecord) {
    return NextResponse.json({ error: 'anchor_not_found' }, { status: 404 });
  }

  if (anchorRecord.status === 'archived') {
    return NextResponse.json({ error: 'anchor_archived' }, { status: 400 });
  }

  const trimmedContent = payload.content.trim();
  if (!trimmedContent.length) {
    return NextResponse.json({ error: 'empty_content' }, { status: 400 });
  }

  const defaultTitle = payload.title?.trim() || anchorRecord.label;

  const changeDescriptor = buildAnchorChangeDescriptor(
    anchorRecord,
    trimmedContent,
    defaultTitle,
    user.id,
    workspace.id,
    basketId,
    payload.revision_reason,
  );

  try {
    const changeResult = await routeChange(supabase, changeDescriptor);

    if (changeResult.committed) {
      const substrateRow = await fetchAnchorSubstrate(
        supabase,
        basketId,
        anchorRecord.anchor_key,
        anchorRecord.expected_type,
        anchorRecord.linked_substrate_id,
      );

      if (substrateRow?.id) {
        const relationshipCount = await countAnchorRelationships(supabase, basketId, substrateRow.id);
        await linkAnchorToSubstrate(supabase, basketId, anchorRecord.anchor_key, substrateRow.id, relationshipCount);
      }
    }

    const anchors = await listAnchorsWithStatus(supabase, basketId);
    return NextResponse.json({
      decision: changeResult.decision,
      committed: Boolean(changeResult.committed),
      anchors,
    });
  } catch (error) {
    console.error('[anchor-save] mutation failed', error);
    return NextResponse.json({ error: 'anchor_save_failed', details: String(error) }, { status: 500 });
  }
}
