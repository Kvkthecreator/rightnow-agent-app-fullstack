import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { loadBasketModeConfig } from '@/basket-modes/loader';
import type { AnchorSpec, BasketModeId } from '@/basket-modes/types';

interface AnchorStatusResponse {
  anchors: Array<{
    id: string;
    label: string;
    scope: AnchorSpec['scope'];
    substrateType: AnchorSpec['substrateType'];
    required: boolean;
    status: 'missing' | 'in_progress' | 'complete';
    count: number;
    updated_at?: string | null;
    preview?: string | null;
    title?: string | null;
    content?: string | null;
  }>;
}

type AnchorRow = {
  id: string;
  title?: string | null;
  body_md?: string | null;
  content?: string | null;
  state?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  updated_at?: string | null;
};

function summariseContent(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed.length) return null;
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157)}…`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const modeId = (basketRow.mode ?? 'default') as BasketModeId;
  const modeConfig = await loadBasketModeConfig(modeId);
  const allAnchors = [...modeConfig.anchors.core, ...modeConfig.anchors.brain];

  const results: AnchorStatusResponse['anchors'] = [];

  for (const anchor of allAnchors) {
    if (anchor.substrateType === 'relationship') {
    results.push({
      id: anchor.id,
      label: anchor.label,
      scope: anchor.scope,
      substrateType: anchor.substrateType,
      required: anchor.required,
      status: 'missing',
      count: 0,
      content: null,
    });
      continue;
    }

    const table = anchor.substrateType === 'block' ? 'blocks' : 'context_items';
    const selectColumns = anchor.substrateType === 'block'
      ? 'id, title, body_md, state, metadata, updated_at'
      : 'id, title, content, status, metadata, updated_at';

    const { data, error, count } = await supabase
      .from(table)
      .select(selectColumns, { count: 'exact' })
      .eq('basket_id', basketId)
      .eq('metadata->>anchor_id', anchor.id)
      .neq('state', 'ARCHIVED')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[anchor-status] failed to load anchor', anchor.id, error);
      results.push({
        id: anchor.id,
        label: anchor.label,
        scope: anchor.scope,
        substrateType: anchor.substrateType,
        required: anchor.required,
        status: 'missing',
        count: 0,
        content: null,
      });
      continue;
    }

    const latest = (data?.[0] ?? null) as AnchorRow | null;
    const populated = (count ?? 0) > 0 && latest;
    const isApproved = anchor.substrateType === 'block'
      ? latest?.state === 'ACCEPTED'
      : (latest?.status ?? '').toUpperCase() === 'ACTIVE';

    const rawContent = anchor.substrateType === 'block'
      ? latest?.body_md ?? latest?.content ?? null
      : latest?.content ?? null;

    results.push({
      id: anchor.id,
      label: anchor.label,
      scope: anchor.scope,
      substrateType: anchor.substrateType,
      required: anchor.required,
      status: !populated ? 'missing' : isApproved ? 'complete' : 'in_progress',
      count: count ?? 0,
      updated_at: latest?.updated_at ?? null,
      preview: summariseContent(rawContent),
      title: latest?.title ?? null,
      content: rawContent,
    });
  }

  const response: AnchorStatusResponse = { anchors: results };
  return NextResponse.json(response);
}
