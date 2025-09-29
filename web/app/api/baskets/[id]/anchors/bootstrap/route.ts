import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { createBlockCanonical, createContextItemCanonical } from '@/lib/governance/canonicalSubstrateOps';

interface RequestBody {
  problemStatement?: string;
  primaryCustomer?: string;
  productVision?: string;
  successMetrics?: string;
}

function trimOrNull(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const problemStatement = trimOrNull(body.problemStatement);
  const primaryCustomer = trimOrNull(body.primaryCustomer);
  const productVision = trimOrNull(body.productVision);
  const successMetrics = trimOrNull(body.successMetrics);

  const workItems = [problemStatement, primaryCustomer, productVision, successMetrics].filter(Boolean);
  if (workItems.length === 0) {
    return NextResponse.json({ error: 'no_anchor_payload' }, { status: 400 });
  }

  const { data: basketRow, error: basketError } = await supabase
    .from('baskets')
    .select('id, workspace_id, mode')
    .eq('id', basketId)
    .maybeSingle();

  if (basketError || !basketRow) {
    return NextResponse.json({ error: 'basket_not_found' }, { status: 404 });
  }

  if (basketRow.workspace_id !== workspace.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const anchorResults: { anchor_id: string; record_id: string; type: string }[] = [];

  try {
    if (problemStatement) {
      const result = await createBlockCanonical(supabase, {
        title: 'Problem',
        body_md: problemStatement,
        metadata: { anchor_id: 'core_problem', anchor_scope: 'core' },
        semantic_type: 'problem',
      }, basketId, workspace.id);
      anchorResults.push({ anchor_id: 'core_problem', record_id: result.created_id!, type: result.type });
    }

    if (primaryCustomer) {
      const result = await createBlockCanonical(supabase, {
        title: 'Primary Customer',
        body_md: primaryCustomer,
        metadata: { anchor_id: 'core_customer', anchor_scope: 'core' },
        semantic_type: 'persona',
      }, basketId, workspace.id);
      anchorResults.push({ anchor_id: 'core_customer', record_id: result.created_id!, type: result.type });
    }

    if (productVision) {
      const result = await createBlockCanonical(supabase, {
        title: 'Product Vision',
        body_md: productVision,
        metadata: { anchor_id: 'product_vision', anchor_scope: 'core' },
        semantic_type: 'vision',
      }, basketId, workspace.id);
      anchorResults.push({ anchor_id: 'product_vision', record_id: result.created_id!, type: result.type });
    }

    if (successMetrics) {
      const result = await createContextItemCanonical(supabase, {
        label: 'Success Metrics',
        content: successMetrics,
        metadata: { anchor_id: 'success_metrics', anchor_scope: 'core' },
        kind: 'metric',
      }, basketId, workspace.id);
      anchorResults.push({ anchor_id: 'success_metrics', record_id: result.created_id!, type: result.type });
    }
  } catch (error) {
    console.error('[basket-anchor-bootstrap] failed', error);
    return NextResponse.json({ error: 'anchor_bootstrap_failed', details: String(error) }, { status: 500 });
  }

  return NextResponse.json({ anchors_created: anchorResults });
}
