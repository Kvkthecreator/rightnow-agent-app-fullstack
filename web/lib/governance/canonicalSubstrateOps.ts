import type { SupabaseClient } from '@supabase/supabase-js';

type AnySupabase = SupabaseClient<any, any, any>;

function coerceArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export interface OperationResult {
  created_id?: string;
  updated_id?: string;
  type: string;
}

export async function createBlockCanonical(
  supabase: AnySupabase,
  op: any,
  basketId: string,
  workspaceId: string
): Promise<OperationResult> {
  const metadata = op.metadata || {};
  const title = op.title || metadata.title || 'Untitled insight';
  const semanticType = op.semantic_type || metadata.semantic_type || 'insight';
  const confidence = op.confidence ?? metadata.confidence ?? 0.7;
  const bodySource = op.body_md ?? op.content ?? metadata.summary ?? '';
  const body = typeof bodySource === 'string' ? bodySource : JSON.stringify(bodySource);

  const { data, error } = await supabase.rpc('fn_block_create', {
    p_basket_id: basketId,
    p_workspace_id: workspaceId,
    p_title: title,
    p_body_md: body,
  });

  if (error) {
    throw new Error(`fn_block_create failed: ${error.message}`);
  }

  let blockId = Array.isArray(data) ? data[0] : data;
  if (blockId && typeof blockId === 'object') {
    const values = Object.values(blockId);
    blockId = values[0] as string | undefined;
  }
  if (!blockId) {
    throw new Error('fn_block_create returned no block id');
  }

  const updates = {
    semantic_type: semanticType,
    metadata,
    confidence_score: confidence,
    state: 'ACCEPTED',
  };

  const { data: updateData, error: updateError } = await supabase
    .from('blocks')
    .update(updates)
    .eq('id', blockId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to finalize block ${blockId}: ${updateError.message}`);
  }

  return { created_id: updateData.id, type: 'block' };
}

export async function createContextItemCanonical(
  supabase: AnySupabase,
  op: any,
  basketId: string,
  workspaceId: string
): Promise<OperationResult> {
  const metadata = { ...(op.metadata || {}) };
  const label = op.label || op.title || metadata.title || 'Untitled context';
  const normalizedLabel = label.toLowerCase();
  const synonyms = coerceArray(op.synonyms ?? metadata.synonyms);
  const confidence = op.confidence ?? metadata.confidence ?? 0.7;
  const contentSource = op.content ?? metadata.summary ?? null;
  const content = typeof contentSource === 'string' || contentSource === null
    ? contentSource
    : JSON.stringify(contentSource);

  metadata.synonyms = synonyms;

  const { data, error } = await supabase.rpc('fn_context_item_upsert_bulk', {
    p_items: [
      {
        basket_id: basketId,
        type: op.kind || metadata.kind || 'concept',
        title: label,
        content,
        description: metadata.description || null,
        metadata,
      },
    ],
  });

  if (error) {
    throw new Error(`fn_context_item_upsert_bulk failed: ${error.message}`);
  }

  let contextItemId = Array.isArray(data) ? data[0] : data;
  if (contextItemId && typeof contextItemId === 'object') {
    const values = Object.values(contextItemId);
    contextItemId = values[0] as string | undefined;
  }
  if (!contextItemId) {
    throw new Error('fn_context_item_upsert_bulk returned no context item id');
  }

  const { data: updateData, error: updateError } = await supabase
    .from('context_items')
    .update({
      normalized_label: normalizedLabel,
      confidence_score: confidence,
      metadata,
      content,
      state: 'ACTIVE',
    })
    .eq('id', contextItemId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to finalize context item ${contextItemId}: ${updateError.message}`);
  }

  return { created_id: updateData.id, type: 'context_item' };
}

export async function reviseBlockCanonical(
  supabase: AnySupabase,
  op: any,
  basketId: string,
  workspaceId: string
): Promise<OperationResult> {
  const blockId = op.block_id;
  if (!blockId) {
    throw new Error('reviseBlock requires block_id');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('blocks')
    .select('id, body_md, content, semantic_type, metadata, confidence_score, title')
    .eq('id', blockId)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message || `Block ${blockId} not found`);
  }

  const newContentSource = op.content ?? op.body_md ?? existing.body_md ?? existing.content ?? '';
  const newContent = typeof newContentSource === 'string' ? newContentSource : JSON.stringify(newContentSource);
  const newSemanticType = op.semantic_type ?? existing.semantic_type;
  const newConfidence = op.confidence ?? existing.confidence_score ?? 0.7;
  const newMetadata = { ...(existing.metadata || {}), ...(op.metadata || {}) };

  const diffJson = {
    before: {
      content: existing.body_md ?? existing.content,
      semantic_type: existing.semantic_type,
    },
    after: {
      content: newContent,
      semantic_type: newSemanticType,
    },
  };

  try {
    await supabase.rpc('fn_block_revision_create', {
      p_basket_id: basketId,
      p_block_id: blockId,
      p_workspace_id: workspaceId,
      p_summary: op.revision_reason || 'Governed block revision',
      p_diff_json: diffJson,
    });
  } catch (e: any) {
    throw new Error(`fn_block_revision_create failed: ${e?.message || e}`);
  }

  const { data: updated, error: updateError } = await supabase
    .from('blocks')
    .update({
      body_md: newContent,
      content: newContent,
      semantic_type: newSemanticType,
      confidence_score: newConfidence,
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message || `Failed to update block ${blockId}`);
  }

  return { updated_id: updated.id, type: 'block' };
}

export async function updateContextItemCanonical(
  supabase: AnySupabase,
  op: any,
  basketId: string,
  workspaceId: string
): Promise<OperationResult> {
  const contextItemId = op.context_item_id;
  if (!contextItemId) {
    throw new Error('updateContextItem requires context_item_id');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('context_items')
    .select('id, title, content, description, metadata, confidence_score, type, normalized_label')
    .eq('id', contextItemId)
    .eq('basket_id', basketId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message || `Context item ${contextItemId} not found`);
  }

  const label = op.label ?? existing.title ?? '';
  const normalizedLabel = label ? label.toLowerCase() : existing['normalized_label'] ?? existing.title?.toLowerCase() ?? null;
  const content = op.content ?? existing.content ?? existing.description ?? null;
  const synonymsInput = op.synonyms ?? op.additional_synonyms ?? existing.metadata?.synonyms ?? [];
  const synonyms = Array.isArray(synonymsInput)
    ? synonymsInput
    : String(synonymsInput)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const metadata = {
    ...(existing.metadata || {}),
    ...(op.metadata || {}),
    synonyms,
  };

  const { data: updated, error: updateError } = await supabase
    .from('context_items')
    .update({
      title: label || existing.title,
      normalized_label,
      content,
      description: op.description ?? existing.description ?? content,
      type: op.kind ?? existing['type'],
      confidence_score: op.confidence ?? existing.confidence_score ?? 0.7,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contextItemId)
    .eq('basket_id', basketId)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message || `Failed to update context item ${contextItemId}`);
  }

  return { updated_id: updated.id, type: 'context_item' };
}
