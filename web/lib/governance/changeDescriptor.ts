/**
 * ChangeDescriptor: Canonical representation of any user/system change request
 * 
 * Provides unified abstraction for all substrate mutations regardless of origin.
 * Used by PolicyDecider to determine routing (proposal vs direct commit).
 */

import { EntryPoint } from './flagsServer';

export type ChangeDescriptor = {
  // Context
  entry_point: EntryPoint;
  actor_id: string;
  workspace_id: string;
  basket_id?: string;
  basis_snapshot_id?: string;
  
  // Risk assessment
  blast_radius?: 'Local' | 'Scoped' | 'Global';
  
  // Operations to execute
  ops: OperationDescriptor[];
  
  // Provenance tracking
  provenance?: ProvenanceEntry[];
};

export type OperationDescriptor = 
  | CreateBlockOp
  | ReviseBlockOp
  | CreateContextItemOp
  | AttachContextItemOp
  | MergeContextItemsOp
  | PromoteScopeOp
  | DetachOp
  | RenameOp
  | ContextAliasOp
  | DocumentEditOp;

// Block operations
export interface CreateBlockOp {
  type: 'CreateBlock';
  data: {
    content: string;
    semantic_type: string;
    canonical_value?: string;
    confidence?: number;
    scope?: 'LOCAL' | 'WORKSPACE' | 'GLOBAL';
  };
}

export interface ReviseBlockOp {
  type: 'ReviseBlock';
  data: {
    block_id: string;
    content?: string;
    canonical_value?: string;
    confidence?: number;
    revision_reason?: string;
  };
}

// Context item operations
export interface CreateContextItemOp {
  type: 'CreateContextItem';
  data: {
    label: string;
    content?: string;
    synonyms?: string[];
    kind?: 'concept' | 'entity' | 'topic' | 'theme';
    confidence?: number;
  };
}

export interface AttachContextItemOp {
  type: 'AttachContextItem';
  data: {
    context_item_id: string;
    target_id: string;
    target_type: 'block' | 'document' | 'relationship';
    relationship_type?: string;
  };
}

export interface MergeContextItemsOp {
  type: 'MergeContextItems';
  data: {
    from_ids: string[];
    canonical_id: string;
    merge_strategy: 'absorb' | 'combine' | 'replace';
    merge_reason?: string;
  };
}

// Scope and organizational operations
export interface PromoteScopeOp {
  type: 'PromoteScope';
  data: {
    block_id: string;
    to_scope: 'WORKSPACE' | 'GLOBAL';
    promotion_reason?: string;
  };
}

export interface DetachOp {
  type: 'Detach';
  data: {
    relationship_id: string;
    detach_reason?: string;
  };
}

export interface RenameOp {
  type: 'Rename';
  data: {
    target_id: string;
    target_type: 'block' | 'context_item' | 'document';
    new_name: string;
    rename_reason?: string;
  };
}

export interface ContextAliasOp {
  type: 'ContextAlias';
  data: {
    context_item_id: string;
    alias: string;
    alias_reason?: string;
  };
}

export interface DocumentEditOp {
  type: 'DocumentEdit';
  data: {
    document_id: string;
    title?: string;
    content?: string;
    edit_reason?: string;
  };
}

// Provenance tracking
export interface ProvenanceEntry {
  type: 'dump' | 'doc' | 'user' | 'agent' | 'import' | 'migration';
  id: string;
  metadata?: Record<string, any>;
}

/**
 * Helper functions for creating common ChangeDescriptors
 */

export function createManualEditDescriptor(
  actorId: string,
  workspaceId: string,
  basketId: string,
  ops: OperationDescriptor[],
  options?: {
    blastRadius?: 'Local' | 'Scoped' | 'Global';
    provenance?: ProvenanceEntry[];
  }
): ChangeDescriptor {
  return {
    entry_point: 'manual_edit',
    actor_id: actorId,
    workspace_id: workspaceId,
    basket_id: basketId,
    blast_radius: options?.blastRadius || 'Local',
    ops,
    provenance: options?.provenance || [
      { type: 'user', id: actorId }
    ]
  };
}

export function createDumpExtractionDescriptor(
  actorId: string,
  workspaceId: string,
  basketId: string,
  dumpId: string,
  ops: OperationDescriptor[]
): ChangeDescriptor {
  return {
    entry_point: 'onboarding_dump',
    actor_id: actorId,
    workspace_id: workspaceId,
    basket_id: basketId,
    blast_radius: 'Scoped', // Dump extractions typically scoped
    ops,
    provenance: [
      { type: 'dump', id: dumpId },
      { type: 'agent', id: 'P1_SUBSTRATE' }
    ]
  };
}

export function createDocumentEditDescriptor(
  actorId: string,
  workspaceId: string,
  documentId: string,
  ops: OperationDescriptor[]
): ChangeDescriptor {
  return {
    entry_point: 'document_edit',
    actor_id: actorId,
    workspace_id: workspaceId,
    blast_radius: 'Global', // Document edits can affect multiple baskets
    ops,
    provenance: [
      { type: 'doc', id: documentId },
      { type: 'user', id: actorId }
    ]
  };
}

export function createReflectionSuggestionDescriptor(
  actorId: string,
  workspaceId: string,
  basketId: string,
  reflectionId: string,
  ops: OperationDescriptor[]
): ChangeDescriptor {
  return {
    entry_point: 'reflection_suggestion',
    actor_id: actorId,
    workspace_id: workspaceId,
    basket_id: basketId,
    blast_radius: 'Local', // Reflection suggestions usually local
    ops,
    provenance: [
      { type: 'agent', id: 'P3_REFLECTION' },
      { type: 'user', id: actorId }
    ]
  };
}

/**
 * Validation helpers for ChangeDescriptor
 */

export function validateChangeDescriptor(cd: ChangeDescriptor): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!cd.entry_point) errors.push('entry_point required');
  if (!cd.actor_id) errors.push('actor_id required');
  if (!cd.workspace_id) errors.push('workspace_id required');
  if (!cd.ops || cd.ops.length === 0) errors.push('ops array required and non-empty');
  
  // Validate operations
  for (let i = 0; i < cd.ops.length; i++) {
    const op = cd.ops[i];
    if (!op.type) errors.push(`ops[${i}].type required`);
    if (!op.data) errors.push(`ops[${i}].data required`);
    
    // Type-specific validation
    switch (op.type) {
      case 'CreateBlock':
        if (!op.data.content) errors.push(`ops[${i}].data.content required for CreateBlock`);
        if (!op.data.semantic_type) errors.push(`ops[${i}].data.semantic_type required for CreateBlock`);
        break;
      case 'CreateContextItem':
        if (!op.data.label) errors.push(`ops[${i}].data.label required for CreateContextItem`);
        break;
      case 'ReviseBlock':
        if (!op.data.block_id) errors.push(`ops[${i}].data.block_id required for ReviseBlock`);
        break;
      // Add more validations as needed
    }
  }
  
  // Validate blast_radius if provided
  if (cd.blast_radius && !['Local', 'Scoped', 'Global'].includes(cd.blast_radius)) {
    errors.push('blast_radius must be Local, Scoped, or Global');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Risk assessment helpers
 */

export function computeOperationRisk(ops: OperationDescriptor[]): {
  scope_impact: 'low' | 'medium' | 'high';
  operation_count: number;
  operation_types: string[];
} {
  const operationTypes = ops.map(op => op.type);
  const uniqueTypes = new Set(operationTypes);
  
  // Assess scope impact based on operation types
  let scopeImpact: 'low' | 'medium' | 'high' = 'low';
  
  if (ops.some(op => op.type === 'PromoteScope' || op.type === 'DocumentEdit')) {
    scopeImpact = 'high';
  } else if (ops.some(op => op.type === 'MergeContextItems' || op.type === 'AttachContextItem')) {
    scopeImpact = 'medium';
  }
  
  return {
    scope_impact: scopeImpact,
    operation_count: ops.length,
    operation_types: Array.from(uniqueTypes)
  };
}

/**
 * Debugging and introspection helpers
 */

export function summarizeChange(cd: ChangeDescriptor): string {
  const risk = computeOperationRisk(cd.ops);
  const opSummary = risk.operation_types.join(', ');
  
  return `${cd.entry_point}: ${risk.operation_count} ops (${opSummary}) [${cd.blast_radius || 'Unknown'}]`;
}