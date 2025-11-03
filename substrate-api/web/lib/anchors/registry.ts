import { SupabaseClient } from '@supabase/supabase-js';
import type { AnchorStatusSummary, BasketAnchorRecord, AnchorExpectedType, AnchorScope } from './types';

const MAX_ANCHOR_STALE_DAYS = 21;
const APPROVED_BLOCK_STATES = new Set(['ACCEPTED', 'LOCKED', 'CONSTANT']);
const APPROVED_CONTEXT_STATES = new Set(['ACTIVE']);

function computeIsStale(updatedAt?: string | null): boolean {
  if (!updatedAt) return true;
  const updatedTs = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedTs)) return true;
  const staleThreshold = Date.now() - MAX_ANCHOR_STALE_DAYS * 24 * 60 * 60 * 1000;
  return updatedTs < staleThreshold;
}

function anchorScopeOrder(scope: AnchorScope): number {
  switch (scope) {
    case 'core':
      return 0;
    case 'brain':
      return 1;
    default:
      return 2;
  }
}

async function loadRegistry(
  supabase: SupabaseClient,
  basketId: string
): Promise<BasketAnchorRecord[]> {
  // Phase A: Load anchors from substrate metadata (anchor_role, anchor_status, anchor_confidence)
  // Query both blocks and context_items for anchored substrate

  const { data: anchoredSubstrate, error } = await supabase
    .from('anchored_substrate')
    .select('*')
    .eq('basket_id', basketId)
    .eq('anchor_status', 'accepted') // Only load accepted anchors
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load anchor registry: ${error.message}`);
  }

  // Transform anchored substrate to BasketAnchorRecord format
  // This maintains compatibility with existing code while using new schema
  return (anchoredSubstrate || []).map((item, index) => ({
    id: item.substrate_id,
    basket_id: basketId,
    anchor_key: item.anchor_role, // role becomes the key
    label: item.title || item.anchor_role,
    scope: 'core', // Default scope (can be inferred from metadata if needed)
    expected_type: item.substrate_type as 'block' | 'context_item',
    required: false, // Advisory only (Phase A change)
    description: null,
    ordering: index,
    linked_substrate_id: item.substrate_id,
    status: 'active',
    metadata: item.metadata || {},
    last_refreshed_at: item.updated_at,
    last_relationship_count: 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })) as BasketAnchorRecord[];
}

function summariseContent(body?: string | null, content?: string | null): string | null {
  const source = body ?? content ?? null;
  if (!source) return null;
  const trimmed = source.replace(/\s+/g, ' ').trim();
  if (!trimmed.length) return null;
  if (trimmed.length <= 280) return trimmed;
  return `${trimmed.slice(0, 277)}…`;
}

interface SubstrateMaps {
  blocks: Map<string, any>;
  contextItems: Map<string, any>;
  relationshipCounts: Map<string, number>;
}

async function buildSubstrateMaps(
  supabase: SupabaseClient,
  basketId: string,
  anchors: BasketAnchorRecord[],
  anchorKeys: string[]
): Promise<SubstrateMaps> {
  const linkedIds = anchors
    .map(anchor => anchor.linked_substrate_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const anchorRoles = anchorKeys.filter(key => true); // anchor roles to query

  // Phase A: Query substrate by anchor_role (not metadata->anchor_id)
  // V3.0: Only query blocks table (context_items sunset)
  const blockQuery = supabase
    .from('blocks')
    .select('id, title, body_md, content, metadata, semantic_type, state, status, updated_at, created_at, anchor_role')
    .eq('basket_id', basketId)
    .in('anchor_role', anchorRoles);

  const blockRes = await blockQuery;

  if (blockRes.error) {
    throw new Error(`Failed to load anchor blocks: ${blockRes.error.message}`);
  }

  // Phase A: Use anchor_role as key (not metadata.anchor_id)
  const blockMap = new Map<string, any>();
  for (const row of blockRes.data ?? []) {
    blockMap.set(row.id, row);
    // Map by anchor_role for lookups by role
    if (row.anchor_role && !blockMap.has(row.anchor_role)) {
      blockMap.set(row.anchor_role, row);
    }
  }

  // V3.0: No context_items map (table sunset)
  const contextMap = new Map<string, any>();

  const substrateIds = [...new Set([
    ...linkedIds,
    ...Array.from(blockMap.values()).map(row => row.id as string),
    ...Array.from(contextMap.values()).map(row => row.id as string),
  ])];

  const relationshipCounts = new Map<string, number>();

  if (substrateIds.length) {
    const [fromRes, toRes] = await Promise.all([
      supabase
        .from('substrate_relationships')
        .select('from_id')
        .eq('basket_id', basketId)
        .in('from_id', substrateIds),
      supabase
        .from('substrate_relationships')
        .select('to_id')
        .eq('basket_id', basketId)
        .in('to_id', substrateIds),
    ]);

    if (fromRes.error) {
      throw new Error(`Failed to load relationship counts: ${fromRes.error.message}`);
    }
    if (toRes.error) {
      throw new Error(`Failed to load relationship counts: ${toRes.error.message}`);
    }

    for (const row of fromRes.data ?? []) {
      const id = row.from_id as string;
      relationshipCounts.set(id, (relationshipCounts.get(id) ?? 0) + 1);
    }
    for (const row of toRes.data ?? []) {
      const id = row.to_id as string;
      relationshipCounts.set(id, (relationshipCounts.get(id) ?? 0) + 1);
    }
  }

  return {
    blocks: blockMap,
    contextItems: contextMap,
    relationshipCounts,
  };
}

function deriveLifecycle(
  anchor: BasketAnchorRecord,
  expectedType: AnchorExpectedType,
  substrate: any | null
): { lifecycle: AnchorStatusSummary['lifecycle']; isStale: boolean; lastUpdatedAt?: string | null } {
  if (anchor.status === 'archived') {
    return { lifecycle: 'archived', isStale: false, lastUpdatedAt: substrate?.updated_at ?? null };
  }

  if (!substrate) {
    return { lifecycle: 'missing', isStale: false };
  }

  if (expectedType === 'block') {
    const state = (substrate.state ?? '').toUpperCase();
    if (!APPROVED_BLOCK_STATES.has(state)) {
      return { lifecycle: 'draft', isStale: false, lastUpdatedAt: substrate.updated_at };
    }
  } else {
    const state = (substrate.state ?? '').toUpperCase();
    if (!APPROVED_CONTEXT_STATES.has(state)) {
      return { lifecycle: 'draft', isStale: false, lastUpdatedAt: substrate.updated_at };
    }
  }

  const stale = computeIsStale(substrate.updated_at ?? anchor.last_refreshed_at ?? anchor.updated_at);
  return {
    lifecycle: stale ? 'stale' : 'approved',
    isStale: stale,
    lastUpdatedAt: substrate.updated_at ?? anchor.last_refreshed_at ?? anchor.updated_at,
  };
}

export async function listAnchorsWithStatus(
  supabase: SupabaseClient,
  basketId: string
): Promise<AnchorStatusSummary[]> {
  const { data: basketRow, error: basketError } = await supabase
    .from('baskets')
    .select('id')
    .eq('id', basketId)
    .maybeSingle();

  if (basketError || !basketRow) {
    throw new Error(`Basket not found: ${basketError?.message || basketId}`);
  }

  const registry = await loadRegistry(supabase, basketId);
  const anchorKeys = registry.map(anchor => anchor.anchor_key);

  const { blocks, contextItems, relationshipCounts } = await buildSubstrateMaps(supabase, basketId, registry, anchorKeys);

  const summaries: AnchorStatusSummary[] = registry
    .map((anchor) => {
      const expectedType = anchor.expected_type as AnchorExpectedType;
      const substrate = (() => {
        if (anchor.linked_substrate_id) {
          if (expectedType === 'block') {
            return blocks.get(anchor.linked_substrate_id) || blocks.get(anchor.anchor_key) || null;
          }
          return contextItems.get(anchor.linked_substrate_id) || contextItems.get(anchor.anchor_key) || null;
        }
        if (expectedType === 'block') {
          return blocks.get(anchor.anchor_key) || null;
        }
        return contextItems.get(anchor.anchor_key) || null;
      })();

      const { lifecycle, isStale, lastUpdatedAt } = deriveLifecycle(anchor, expectedType, substrate);

      const substrateSummary = substrate
        ? {
            id: substrate.id,
            type: expectedType,
            title: substrate.title || anchor.label,
            content_snippet: summariseContent(substrate.body_md, substrate.content),
            semantic_type: (substrate.semantic_type ?? substrate.type ?? substrate.metadata?.semantic_type) || null,
            state: substrate.state ?? null,
            status: substrate.status ?? null,
            updated_at: substrate.updated_at ?? null,
            created_at: substrate.created_at ?? null,
            metadata: substrate.metadata ?? null,
          }
        : null;

      const relCount = substrateSummary?.id
        ? (relationshipCounts.get(substrateSummary.id) ?? anchor.last_relationship_count ?? 0)
        : anchor.last_relationship_count ?? 0;

      return {
        anchor_key: anchor.anchor_key,
        scope: anchor.scope,
        expected_type: expectedType,
        label: anchor.label,
        required: anchor.required,
        description: anchor.description,
        ordering: anchor.ordering ?? undefined,
        lifecycle,
        is_stale: isStale,
        linked_substrate: substrateSummary,
        relationships: relCount,
        last_refreshed_at: anchor.last_refreshed_at ?? null,
        last_updated_at: lastUpdatedAt ?? null,
        last_relationship_count: anchor.last_relationship_count ?? 0,
        registry_id: anchor.id,
        metadata: anchor.metadata ?? {},
      } satisfies AnchorStatusSummary;
    })
    .sort((a, b) => {
      const scopeOrder = anchorScopeOrder(a.scope) - anchorScopeOrder(b.scope);
      if (scopeOrder !== 0) return scopeOrder;
      const orderingA = a.ordering ?? 0;
      const orderingB = b.ordering ?? 0;
      if (orderingA !== orderingB) return orderingA - orderingB;
      return a.label.localeCompare(b.label);
    });

  return summaries;
}

export async function upsertAnchorRegistryRow(
  supabase: SupabaseClient,
  basketId: string,
  anchorKey: string,
  values: Partial<Omit<BasketAnchorRecord, 'basket_id' | 'anchor_key' | 'id'>>
): Promise<void> {
  const payload = {
    ...values,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('basket_anchors')
    .update(payload)
    .eq('basket_id', basketId)
    .eq('anchor_key', anchorKey);

  if (error) {
    throw new Error(`Failed to update anchor registry: ${error.message}`);
  }
}

export async function insertCustomAnchor(
  supabase: SupabaseClient,
  basketId: string,
  anchorKey: string,
  payload: {
    label: string;
    scope: AnchorScope;
    expected_type: AnchorExpectedType;
    description?: string | null;
    required?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const { error } = await supabase.from('basket_anchors').insert({
    basket_id: basketId,
    anchor_key: anchorKey,
    label: payload.label,
    scope: payload.scope,
    expected_type: payload.expected_type,
    description: payload.description ?? null,
    required: payload.required ?? false,
    metadata: payload.metadata ?? {},
    ordering: 1000, // custom anchors appear after core/brain by default
  });

  if (error) {
    throw new Error(`Failed to create anchor: ${error.message}`);
  }
}

export async function archiveAnchor(
  supabase: SupabaseClient,
  basketId: string,
  anchorKey: string
): Promise<void> {
  const { error } = await supabase
    .from('basket_anchors')
    .update({ status: 'archived', linked_substrate_id: null })
    .eq('basket_id', basketId)
    .eq('anchor_key', anchorKey);

  if (error) {
    throw new Error(`Failed to archive anchor: ${error.message}`);
  }
}

export async function getAnchorRecord(
  supabase: SupabaseClient,
  basketId: string,
  anchorKey: string
): Promise<BasketAnchorRecord | null> {
  const { data, error } = await supabase
    .from('basket_anchors')
    .select('*')
    .eq('basket_id', basketId)
    .eq('anchor_key', anchorKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load anchor ${anchorKey}: ${error.message}`);
  }

  return data as BasketAnchorRecord | null;
}

export async function linkAnchorToSubstrate(
  supabase: SupabaseClient,
  basketId: string,
  anchorKey: string,
  substrateId: string,
  relationshipCount: number | null
): Promise<void> {
  const { error } = await supabase
    .from('basket_anchors')
    .update({
      linked_substrate_id: substrateId,
      last_relationship_count: relationshipCount ?? 0,
      last_refreshed_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('basket_id', basketId)
    .eq('anchor_key', anchorKey);

  if (error) {
    throw new Error(`Failed to link anchor ${anchorKey}: ${error.message}`);
  }
}
