import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { loadBasketModeConfig } from '@/basket-modes/loader';
import type { BasketModeId } from '@/basket-modes/types';
import {
  createBlockCanonical,
  createContextItemCanonical,
  reviseBlockCanonical,
} from '@/lib/governance/canonicalSubstrateOps';

const payloadSchema = z.object({
  anchor_id: z.string().min(1),
  content: z.string().min(1),
  title: z.string().trim().optional(),
});

const SEMANTIC_TYPE_OVERRIDES: Record<string, string> = {
  core_problem: 'problem',
  core_customer: 'persona',
  product_vision: 'vision',
  success_metrics: 'metric',
  core_solution: 'solution',
  feature_block: 'feature',
};

const CONTEXT_KIND_OVERRIDES: Record<string, string> = {
  technical_constraints: 'constraint',
  customer_insights: 'insight',
  roadmap_milestone: 'milestone',
};

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

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

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

  const modeConfig = await loadBasketModeConfig((basketRow.mode ?? 'default') as BasketModeId);
  const anchorSpec = [...modeConfig.anchors.core, ...modeConfig.anchors.brain].find((anchor) => anchor.id === payload.anchor_id);

  if (!anchorSpec) {
    return NextResponse.json({ error: 'anchor_not_found' }, { status: 404 });
  }

  if (anchorSpec.substrateType === 'relationship') {
    return NextResponse.json({ error: 'unsupported_anchor_type' }, { status: 400 });
  }

  const trimmedContent = payload.content.trim();
  if (!trimmedContent.length) {
    return NextResponse.json({ error: 'empty_content' }, { status: 400 });
  }

  const defaultTitle = payload.title?.trim() || anchorSpec.label;
  const metadata = {
    anchor_id: anchorSpec.id,
    anchor_scope: anchorSpec.scope,
  };

  try {
    if (anchorSpec.substrateType === 'block') {
      const { data: existingRows, error: fetchError } = await supabase
        .from('blocks')
        .select('id, body_md, metadata, semantic_type, title, confidence_score')
        .eq('basket_id', basketId)
        .eq('metadata->>anchor_id', anchorSpec.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      const existing = existingRows?.[0] ?? null;

      const semanticType = SEMANTIC_TYPE_OVERRIDES[anchorSpec.id] || existing?.semantic_type || 'insight';

      if (existing) {
        await reviseBlockCanonical(
          supabase,
          {
            block_id: existing.id,
            body_md: trimmedContent,
            metadata: { ...(existing.metadata ?? {}), ...metadata },
            semantic_type: semanticType,
            confidence: existing.confidence_score ?? 0.7,
            title: defaultTitle,
          },
          basketId,
          workspace.id,
        );
      } else {
        await createBlockCanonical(
          supabase,
          {
            title: defaultTitle,
            body_md: trimmedContent,
            metadata,
            semantic_type: semanticType,
          },
          basketId,
          workspace.id,
        );
      }
    } else {
      const { data: existingRows, error: fetchError } = await supabase
        .from('context_items')
        .select('id, content, metadata, title, type, confidence_score')
        .eq('basket_id', basketId)
        .eq('metadata->>anchor_id', anchorSpec.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      const existing = existingRows?.[0] ?? null;

      const kind = CONTEXT_KIND_OVERRIDES[anchorSpec.id] || existing?.type || 'concept';

      if (existing) {
        const { error: updateError } = await supabase
          .from('context_items')
          .update({
            title: defaultTitle,
            content: trimmedContent,
            metadata: { ...(existing.metadata ?? {}), ...metadata },
            type: kind,
            state: 'ACTIVE',
            status: 'active',
            updated_at: new Date().toISOString(),
            confidence_score: existing.confidence_score ?? 0.7,
          })
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        await createContextItemCanonical(
          supabase,
          {
            label: defaultTitle,
            content: trimmedContent,
            metadata,
            kind,
          },
          basketId,
          workspace.id,
        );
      }
    }
  } catch (error) {
    console.error('[anchor-save] mutation failed', error);
    return NextResponse.json({ error: 'anchor_save_failed', details: String(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
