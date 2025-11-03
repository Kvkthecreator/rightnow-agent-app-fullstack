import { createManualEditDescriptor } from '@/lib/governance/changeDescriptor';
import type { ChangeDescriptor, OperationDescriptor } from '@/lib/governance/changeDescriptor';
import type { BasketAnchorRecord } from './types';

const SEMANTIC_DEFAULTS: Record<string, string> = {
  core_problem: 'problem',
  core_customer: 'persona',
  product_vision: 'vision',
  success_metrics: 'metric',
  core_solution: 'solution',
  feature_block: 'feature',
};

const CONTEXT_KIND_DEFAULTS: Record<string, string> = {
  technical_constraints: 'constraint',
  customer_insights: 'insight',
  roadmap_milestone: 'milestone',
};

export function buildAnchorOperations(
  anchor: BasketAnchorRecord,
  content: string,
  title: string,
  revisionReason?: string
): OperationDescriptor[] {
  const metadataBase = {
    anchor_id: anchor.anchor_key,
    anchor_scope: anchor.scope,
    anchor_label: anchor.label,
  };

  if (anchor.expected_type === 'block') {
    const semanticType = anchor.metadata?.semantic_type || SEMANTIC_DEFAULTS[anchor.anchor_key] || 'insight';

    if (anchor.linked_substrate_id) {
      return [{
        type: 'ReviseBlock',
        data: {
          block_id: anchor.linked_substrate_id,
          content,
          semantic_type: semanticType,
          title,
          metadata: { ...metadataBase },
          revision_reason: revisionReason || 'Anchor revision',
        },
      }];
    }

    return [{
      type: 'CreateBlock',
      data: {
        content,
        semantic_type: semanticType,
        title,
        metadata: { ...metadataBase },
        confidence: 0.8,
      },
    }];
  }

  // V3.0: All anchors create blocks with appropriate semantic_type
  // Map legacy "kind" to semantic_type
  const kind = anchor.metadata?.kind || CONTEXT_KIND_DEFAULTS[anchor.anchor_key] || 'concept';
  const semanticTypeMap: Record<string, string> = {
    'constraint': 'constraint',
    'insight': 'insight',
    'milestone': 'fact',
    'concept': 'entity',
  };
  const semanticType = semanticTypeMap[kind] || 'entity';

  if (anchor.linked_substrate_id) {
    return [{
      type: 'ReviseBlock',
      data: {
        block_id: anchor.linked_substrate_id,
        content,
        semantic_type: semanticType,
        title,
        metadata: { ...metadataBase, legacy_kind: kind },
        revision_reason: revisionReason || 'Anchor revision',
      },
    }];
  }

  return [{
    type: 'CreateBlock',
    data: {
      content,
      semantic_type: semanticType,
      title,
      metadata: { ...metadataBase, legacy_kind: kind },
      confidence: 0.8,
    },
  }];
}

export function buildAnchorChangeDescriptor(
  anchor: BasketAnchorRecord,
  content: string,
  title: string,
  actorId: string,
  workspaceId: string,
  basketId: string,
  revisionReason?: string
): ChangeDescriptor {
  const ops = buildAnchorOperations(anchor, content, title, revisionReason);
  return createManualEditDescriptor(actorId, workspaceId, basketId, ops, {
    blastRadius: 'Local',
    provenance: [
      { type: 'user', id: actorId },
      { type: 'agent', id: 'anchor.capture', metadata: { anchor_id: anchor.anchor_key } },
    ],
  });
}

export async function fetchAnchorSubstrate(
  supabase: any,
  basketId: string,
  anchorKey: string,
  expectedType: 'block' | 'context_item',
  linkedId?: string | null,
) {
  if (linkedId) {
    const table = expectedType === 'block' ? 'blocks' : 'context_items';
    const selectColumns = expectedType === 'block'
      ? 'id, title, body_md, content, metadata, semantic_type, state, status, updated_at, created_at'
      : 'id, title, content, metadata, type, semantic_category, state, status, updated_at, created_at';

    const { data } = await supabase
      .from(table)
      .select(selectColumns)
      .eq('id', linkedId)
      .maybeSingle();

    if (data) return data;
  }

  const table = expectedType === 'block' ? 'blocks' : 'context_items';
  const selectColumns = expectedType === 'block'
    ? 'id, title, body_md, content, metadata, semantic_type, state, status, updated_at, created_at'
    : 'id, title, content, metadata, type, semantic_category, state, status, updated_at, created_at';

  const { data } = await supabase
    .from(table)
    .select(selectColumns)
    .eq('basket_id', basketId)
    .eq('metadata->>anchor_id', anchorKey)
    .order('updated_at', { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

export async function countAnchorRelationships(
  supabase: any,
  basketId: string,
  substrateId: string
): Promise<number> {
  const filter = `from_id.eq.${substrateId},to_id.eq.${substrateId}`;
  const { data, error } = await supabase
    .from('substrate_relationships')
    .select('from_id, to_id')
    .eq('basket_id', basketId)
    .or(filter);

  if (error) {
    throw new Error(`Failed to count relationships: ${error.message}`);
  }

  return data?.length ?? 0;
}
