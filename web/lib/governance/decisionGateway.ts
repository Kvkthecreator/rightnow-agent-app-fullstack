/**
 * Decision Gateway: Single choke-point for all substrate mutations
 * 
 * Routes all changes through unified policy evaluation.
 * Ensures no ad-hoc bypasses of governance decisions.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getWorkspaceFlags } from './flagsServer';
import { ChangeDescriptor, validateChangeDescriptor } from './changeDescriptor';
import { decide, Decision, RiskHints } from './policyDecider';

export interface ChangeResult {
  committed?: boolean;
  proposal_id?: string;
  decision: Decision;
  validation_report?: any;
  execution_summary?: {
    operations_executed: number;
    execution_time_ms: number;
    timeline_events_emitted: number;
  };
}

/**
 * Main entry point: Route any change through unified governance policy.
 */
export async function routeChange(
  supabase: SupabaseClient,
  cd: ChangeDescriptor
): Promise<ChangeResult> {
  // Step 1: Validate change descriptor
  const validation = validateChangeDescriptor(cd);
  if (!validation.valid) {
    throw new Error(`Invalid ChangeDescriptor: ${validation.errors.join(', ')}`);
  }

  // Step 2: Get workspace governance flags
  const flags = await getWorkspaceFlags(supabase, cd.workspace_id);

  // Step 3: Compute risk hints (call P1 Validator or heuristic)
  const riskHints = await computeRiskHints(supabase, cd);

  // Step 4: Make routing decision
  const decision = decide(flags, cd, riskHints);

  // Step 5: Execute based on decision
  if (decision.route === 'direct') {
    return await executeDirectCommit(supabase, cd, decision);
  } else {
    return await createGovernanceProposal(supabase, cd, decision, riskHints);
  }
}

/**
 * Execute operations directly (legacy compatibility path).
 */
async function executeDirectCommit(
  supabase: SupabaseClient,
  cd: ChangeDescriptor,
  decision: Decision
): Promise<ChangeResult> {
  const startTime = Date.now();
  
  try {
    // Use same operation executor as proposal approval for consistency
    const results = await executeOpsTransactional(supabase, cd.ops, {
      actor_id: cd.actor_id,
      workspace_id: cd.workspace_id,
      basket_id: cd.basket_id,
      blast_radius: decision.effective_blast_radius
    });

    // Emit direct commit timeline events
    const timelineEvents = await emitDirectCommitEvents(supabase, cd, results);

    const executionTime = Date.now() - startTime;

    return {
      committed: true,
      decision,
      execution_summary: {
        operations_executed: cd.ops.length,
        execution_time_ms: executionTime,
        timeline_events_emitted: timelineEvents.length
      }
    };

  } catch (error) {
    // Log execution failure
    console.error('Direct commit execution failed:', error);
    
    // Emit failure event
    await emitCommitFailureEvent(supabase, cd, error);
    
    throw new Error(`Direct commit failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create governance proposal for human review.
 */
async function createGovernanceProposal(
  supabase: SupabaseClient,
  cd: ChangeDescriptor,
  decision: Decision,
  riskHints?: RiskHints
): Promise<ChangeResult> {
  try {
    // Step 1: Run validator if required
    let validatorReport;
    
    if (decision.require_validator) {
      try {
        validatorReport = await runValidator(cd, decision);
      } catch (validatorError) {
        // Validator failure blocks proposal creation in strict mode
        if (decision.validator_mode === 'strict') {
          throw new Error(`Validator required but failed: ${validatorError instanceof Error ? validatorError.message : String(validatorError)}`);
        } else {
          // Lenient mode: create warning in validator report
          validatorReport = {
            confidence: 0.5,
            dupes: [],
            ontology_hits: [],
            suggested_merges: [],
            warnings: [`Validator failed: ${validatorError instanceof Error ? validatorError.message : String(validatorError)}`],
            impact_summary: 'Validator unavailable - manual review recommended'
          };
        }
      }
    } else {
      // No validator required - create minimal report
      validatorReport = {
        confidence: riskHints?.confidence || 0.7,
        dupes: [],
        ontology_hits: [],
        suggested_merges: [],
        warnings: decision.validator_mode === 'lenient' ? ['Validator bypassed - lenient mode'] : [],
        impact_summary: `${cd.ops.length} operations pending review`
      };
    }

    // Step 2: Infer proposal kind from operations
    const proposalKind = inferProposalKind(cd.ops);

    // Step 3: Create proposal in database
    const { data: proposal, error: createError } = await supabase
      .from('proposals')
      .insert({
        workspace_id: cd.workspace_id,
        basket_id: cd.basket_id,
        proposal_kind: proposalKind,
        ops: cd.ops,
        origin: cd.entry_point === 'onboarding_dump' ? 'agent' : 'human',
        provenance: cd.provenance || [],
        basis_snapshot_id: cd.basis_snapshot_id,
        validator_report: validatorReport,
        status: 'PROPOSED',
        blast_radius: decision.effective_blast_radius,
        created_by: cd.actor_id
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create proposal: ${createError.message}`);
    }

    // Step 4: Emit proposal submitted event
    await emitProposalSubmittedEvent(supabase, proposal, cd);

    return {
      proposal_id: proposal.id,
      decision,
      validation_report: validatorReport
    };

  } catch (error) {
    console.error('Proposal creation failed:', error);
    throw new Error(`Proposal creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Compute risk hints by calling P1 Validator or using heuristics.
 */
async function computeRiskHints(
  supabase: SupabaseClient,
  cd: ChangeDescriptor
): Promise<RiskHints> {
  try {
    // If validator agent is available, get proper risk assessment
    if (process.env.AGENT_API_URL) {
      const response = await fetch(`${process.env.AGENT_API_URL}/api/validator/assess-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: cd.ops,
          workspace_id: cd.workspace_id,
          basket_id: cd.basket_id,
          entry_point: cd.entry_point
        }),
        signal: AbortSignal.timeout(5000) // 5s timeout
      });

      if (response.ok) {
        const riskData = await response.json();
        return {
          confidence: riskData.confidence,
          conflicts: riskData.conflicts?.length || 0,
          duplicate_count: riskData.dupes?.length || 0,
          complexity_score: riskData.complexity_score
        };
      }
    }

    // Fallback: Heuristic risk assessment
    return computeHeuristicRisk(cd);

  } catch (error) {
    console.warn('Risk assessment failed, using heuristics:', error);
    return computeHeuristicRisk(cd);
  }
}

/**
 * Heuristic risk assessment when validator is unavailable.
 */
function computeHeuristicRisk(cd: ChangeDescriptor): RiskHints {
  const operationRisk = computeOperationRisk(cd.ops);
  
  // Base confidence on operation complexity
  let confidence = 0.8; // Default high confidence
  
  if (operationRisk.scope_impact === 'high') {
    confidence = 0.6; // Lower confidence for high-impact ops
  } else if (operationRisk.operation_count > 5) {
    confidence = 0.7; // Lower confidence for many operations
  }
  
  // Estimate conflicts based on operation types
  const potentialConflicts = cd.ops.filter(op => 
    op.type === 'MergeContextItems' || 
    op.type === 'ReviseBlock' ||
    op.type === 'PromoteScope'
  ).length;
  
  // Simple complexity score based on operation diversity
  const uniqueTypes = new Set(cd.ops.map(op => op.type));
  const complexityScore = uniqueTypes.size / 10; // Normalize to 0-1
  
  return {
    confidence,
    conflicts: potentialConflicts,
    duplicate_count: 0, // Can't detect without validator
    complexity_score: complexityScore
  };
}

/**
 * Execute operations transactionally (shared with proposal approval).
 */
async function executeOpsTransactional(
  supabase: SupabaseClient,
  ops: any[],
  context: {
    actor_id: string;
    workspace_id: string;
    basket_id?: string;
    blast_radius: 'Local' | 'Scoped' | 'Global';
  }
): Promise<any[]> {
  const results = [];
  
  // Execute each operation with error rollback
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    
    try {
      const result = await executeOperation(supabase, op, context.basket_id!, context.workspace_id);
      results.push({
        operation_index: i,
        operation_type: op.type,
        success: true,
        result: result
      });
    } catch (error) {
      // On failure, rollback all previous operations would go here
      // For now, fail fast and let caller handle
      throw new Error(`Operation ${i} (${op.type}) failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return results;
}

/**
 * Re-use existing operation executor from approval route.
 */
async function executeOperation(supabase: any, operation: any, basketId: string, workspaceId: string) {
  // Import and use the same execution logic from approve route
  // This ensures operational parity between direct commits and approved proposals
  
  switch (operation.type) {
    case 'CreateBlock':
      return await createBlock(supabase, operation, basketId, workspaceId);
    case 'CreateContextItem':
      return await createContextItem(supabase, operation, basketId, workspaceId);
    case 'ReviseBlock':
      return await reviseBlock(supabase, operation, basketId, workspaceId);
    case 'MergeContextItems':
      return await mergeContextItems(supabase, operation, basketId, workspaceId);
    case 'AttachContextItem':
      return await attachContextItem(supabase, operation, basketId, workspaceId);
    case 'PromoteScope':
      return await promoteScope(supabase, operation, basketId, workspaceId);
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

// Operation implementations (should be extracted to shared module)
async function createBlock(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('context_blocks')
    .insert({
      basket_id: basketId,
      workspace_id: workspaceId,
      content: op.data.content,
      semantic_type: op.data.semantic_type,
      canonical_value: op.data.canonical_value,
      confidence_score: op.data.confidence || 0.7,
      scope: op.data.scope || 'LOCAL',
      status: 'ACCEPTED'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create block: ${error.message}`);
  return { created_id: data.id, type: 'block' };
}

async function createContextItem(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('context_items')
    .insert({
      basket_id: basketId,
      workspace_id: workspaceId,
      label: op.data.label,
      content: op.data.content,
      synonyms: op.data.synonyms || [],
      kind: op.data.kind || 'concept',
      confidence: op.data.confidence || 0.7,
      state: 'ACTIVE'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create context item: ${error.message}`);
  return { created_id: data.id, type: 'context_item' };
}

async function reviseBlock(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('context_blocks')
    .update({
      content: op.data.content,
      canonical_value: op.data.canonical_value,
      confidence_score: op.data.confidence || 0.7
    })
    .eq('id', op.data.block_id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(`Failed to revise block: ${error.message}`);
  return { updated_id: data.id, type: 'revision' };
}

async function mergeContextItems(supabase: any, op: any, basketId: string, workspaceId: string) {
  // Mark source items as MERGED
  const { error: mergeError } = await supabase
    .from('context_items')
    .update({ state: 'MERGED' })
    .in('id', op.data.from_ids)
    .eq('workspace_id', workspaceId);

  if (mergeError) throw new Error(`Failed to merge context items: ${mergeError.message}`);

  return { 
    merged_ids: op.data.from_ids,
    canonical_id: op.data.canonical_id,
    type: 'merge'
  };
}

async function attachContextItem(supabase: any, op: any, basketId: string, workspaceId: string) {
  // Create relationship between context item and target
  const { data, error } = await supabase
    .from('context_relationships')
    .insert({
      workspace_id: workspaceId,
      from_id: op.data.context_item_id,
      to_id: op.data.target_id,
      relationship_type: op.data.relationship_type || 'relates_to',
      from_type: 'context_item',
      to_type: op.data.target_type
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to attach context item: ${error.message}`);
  return { attached_id: data.id, type: 'attachment' };
}

async function promoteScope(supabase: any, op: any, basketId: string, workspaceId: string) {
  const { data, error } = await supabase
    .from('context_blocks')
    .update({ scope: op.data.to_scope })
    .eq('id', op.data.block_id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(`Failed to promote scope: ${error.message}`);
  return { promoted_id: data.id, new_scope: op.data.to_scope, type: 'promotion' };
}

// (Removed duplicate createGovernanceProposal definition; single implementation remains above)

/**
 * Run P1 Validator Agent for proposal validation.
 */
async function runValidator(
  cd: ChangeDescriptor,
  decision: Decision
): Promise<any> {
  if (!process.env.AGENT_API_URL) {
    throw new Error('Validator required but AGENT_API_URL not configured');
  }

  const timeout = decision.validator_mode === 'strict' ? 10000 : 5000;

  const response = await fetch(`${process.env.AGENT_API_URL}/api/validator/validate-proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proposal_kind: inferProposalKind(cd.ops),
      operations: cd.ops,
      basket_id: cd.basket_id,
      workspace_id: cd.workspace_id,
      entry_point: cd.entry_point,
      blast_radius: cd.blast_radius
    }),
    signal: AbortSignal.timeout(timeout)
  });

  if (!response.ok) {
    throw new Error(`Validator API error: ${response.status} ${response.statusText}`);
  }

  const validationResult = await response.json();
  
  // Validate required fields
  if (!validationResult.confidence || !validationResult.impact_summary) {
    throw new Error('Invalid validator response - missing required fields');
  }

  return validationResult;
}

/**
 * Infer proposal kind from operation types.
 */
function inferProposalKind(ops: any[]): string {
  if (ops.length === 0) return 'Edit';
  
  const types = new Set(ops.map(op => op.type));
  
  // Pattern matching for proposal kinds
  if (types.has('CreateBlock') && ops.length > 1) return 'Extraction';
  if (types.has('MergeContextItems')) return 'Merge';
  if (types.has('AttachContextItem')) return 'Attachment';
  if (types.has('DetachOp')) return 'Detach';
  if (types.has('ReviseBlock')) return 'Revision';
  if (types.has('RenameOp')) return 'Rename';
  if (types.has('ContextAliasOp')) return 'ContextAlias';
  if (types.has('PromoteScope')) return 'ScopePromotion';
  
  // Default to Edit for simple operations
  return 'Edit';
}

/**
 * Timeline event emission helpers.
 */
async function emitProposalSubmittedEvent(
  supabase: SupabaseClient,
  proposal: any,
  cd: ChangeDescriptor
): Promise<void> {
  const { error } = await supabase.rpc('emit_timeline_event', {
    p_basket_id: cd.basket_id,
    p_event_type: 'proposal.submitted',
    p_event_data: {
      proposal_id: proposal.id,
      proposal_kind: proposal.proposal_kind,
      origin: proposal.origin,
      entry_point: cd.entry_point,
      operations_count: cd.ops.length,
      blast_radius: proposal.blast_radius
    },
    p_workspace_id: cd.workspace_id,
    p_actor_id: cd.actor_id
  });

  if (error) {
    console.error('Failed to emit proposal.submitted event:', error);
  }
}

async function emitDirectCommitEvents(
  supabase: SupabaseClient,
  cd: ChangeDescriptor,
  results: any[]
): Promise<any[]> {
  const events = [];

  // Emit substrate.committed event
  const { error: commitError } = await supabase.rpc('emit_timeline_event', {
    p_basket_id: cd.basket_id,
    p_event_type: 'substrate.committed.direct',
    p_event_data: {
      entry_point: cd.entry_point,
      operations_executed: results.length,
      blast_radius: cd.blast_radius,
      execution_results: results
    },
    p_workspace_id: cd.workspace_id,
    p_actor_id: cd.actor_id
  });

  if (!commitError) {
    events.push('substrate.committed.direct');
  }

  return events;
}

async function emitCommitFailureEvent(
  supabase: SupabaseClient,
  cd: ChangeDescriptor,
  error: any
): Promise<void> {
  await supabase.rpc('emit_timeline_event', {
    p_basket_id: cd.basket_id,
    p_event_type: 'commit.failed',
    p_event_data: {
      entry_point: cd.entry_point,
      error_message: error instanceof Error ? error.message : String(error),
      operations_attempted: cd.ops.length
    },
    p_workspace_id: cd.workspace_id,
    p_actor_id: cd.actor_id
  });
}
