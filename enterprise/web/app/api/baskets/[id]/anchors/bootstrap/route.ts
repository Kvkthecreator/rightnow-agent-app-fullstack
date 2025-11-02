import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { getAnchorRecord, linkAnchorToSubstrate, listAnchorsWithStatus } from '@/lib/anchors';
import { buildAnchorChangeDescriptor, fetchAnchorSubstrate, countAnchorRelationships } from '@/lib/anchors/mutationHelpers';
import { routeChange } from '@/lib/governance/decisionGateway';

interface RequestBody {
  problemStatement?: string;
  primaryCustomer?: string;
  productVision?: string;
  successMetrics?: string;
}

const SEED_ANCHORS = [
  { key: 'core_problem', title: 'Problem' },
  { key: 'core_customer', title: 'Primary Customer' },
  { key: 'product_vision', title: 'Product Vision' },
  { key: 'success_metrics', title: 'Success Metrics' },
] as const;

function trimOrNull(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const payloads = {
    core_problem: trimOrNull(body.problemStatement),
    core_customer: trimOrNull(body.primaryCustomer),
    product_vision: trimOrNull(body.productVision),
    success_metrics: trimOrNull(body.successMetrics),
  };

  const hasContent = Object.values(payloads).some(Boolean);
  if (!hasContent) {
    return NextResponse.json({ error: 'no_anchor_payload' }, { status: 400 });
  }

  // Ensure registry seeded
  await listAnchorsWithStatus(supabase, basketId).catch((error) => {
    console.warn('[anchor-bootstrap] failed to pre-load anchors', error);
  });

  const created: Array<{ anchor_id: string; committed: boolean; proposal_id?: string }> = [];

  for (const seed of SEED_ANCHORS) {
    const content = payloads[seed.key as keyof typeof payloads];
    if (!content) continue;

    const anchorRecord = await getAnchorRecord(supabase, basketId, seed.key);
    if (!anchorRecord) {
      console.warn(`[anchor-bootstrap] registry missing for ${seed.key}`);
      continue;
    }

    try {
      const descriptor = buildAnchorChangeDescriptor(
        anchorRecord,
        content,
        seed.title,
        user.id,
        workspace.id,
        basketId,
        'Initial basket bootstrap'
      );

      const result = await routeChange(supabase, descriptor);

      if (result.committed) {
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

      created.push({ anchor_id: seed.key, committed: Boolean(result.committed), proposal_id: result.proposal_id });
    } catch (error) {
      console.error('[anchor-bootstrap] failed to seed anchor', seed.key, error);
    }
  }

  const anchors = await listAnchorsWithStatus(supabase, basketId);

  return NextResponse.json({
    anchors_created: created,
    anchors,
  });
}
