/**
 * Universal Work Router - Canon v2.2 Compliance
 * 
 * Routes ALL substrate mutations through governance framework.
 * Implements Sacred Principles:
 * - Universal Governance (everything flows through governance)
 * - User-Controlled Execution Mode (governance flags determine routing)
 * - Confidence-Informed Routing (confidence is sub-option within modes)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { policyDecider } from './policyDecider';

const AUTO_EXECUTABLE_WORK_TYPES = new Set(['MANUAL_EDIT']);

export interface WorkRequest {
  work_type: string;
  work_payload: {
    operations: Array<{
      type: string;
      data: Record<string, any>;
    }>;
    basket_id: string;
    confidence_score?: number;
    user_override?: 'require_review' | 'allow_auto';
    trace_id?: string;
    provenance?: string[];
  };
  workspace_id: string;
  user_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface WorkRoutingResult {
  work_id: string;
  routing_decision: 'auto_execute' | 'create_proposal' | 'confidence_routing';
  execution_mode: 'auto_execute' | 'create_proposal' | 'confidence_routing';
  proposal_id?: string;
  // When execution_mode is auto_execute, include executor summary
  work_result?: any;
  executed_immediately?: boolean;
}

// Convert string priority to integer for database storage
function priorityToInteger(priority: string): number {
  switch (priority) {
    case 'low': return 1;
    case 'normal': return 5;
    case 'high': return 8;
    case 'urgent': return 10;
    default: return 5; // Default to normal
  }
}

export async function routeWork(
  supabase: SupabaseClient,
  request: WorkRequest
): Promise<WorkRoutingResult> {
  
  // Get governance policy for this work type in this workspace
  const policy = await policyDecider.getWorkTypePolicy(
    supabase,
    request.workspace_id,
    request.work_type
  );

  // Determine execution mode based on governance policy
  let execution_mode: string;
  
  if (request.work_payload.user_override) {
    // User explicit override takes precedence
    execution_mode = request.work_payload.user_override === 'allow_auto' 
      ? 'auto_execute' 
      : 'create_proposal';
  } else if (policy.mode === 'auto') {
    // Auto mode - execute immediately
    execution_mode = 'auto_execute';
  } else if (policy.mode === 'proposal') {
    // Proposal mode - always create proposal
    execution_mode = 'create_proposal';
  } else if (policy.mode === 'confidence' && request.work_payload.confidence_score !== undefined) {
    // Confidence mode - use confidence threshold
    execution_mode = request.work_payload.confidence_score >= policy.confidence_threshold
      ? 'auto_execute'
      : 'create_proposal';
  } else {
    // Default to proposal mode for safety
    execution_mode = 'create_proposal';
  }

  const canAutoExecute = execution_mode === 'auto_execute' && AUTO_EXECUTABLE_WORK_TYPES.has(request.work_type);

  const workId = crypto.randomUUID();

  const insertPayload = {
    id: workId,
    work_id: workId,
    work_type: request.work_type,
    work_payload: request.work_payload,
    workspace_id: request.workspace_id,
    user_id: request.user_id,
    basket_id: request.work_payload.basket_id,
    priority: priorityToInteger(request.priority),
    processing_state: canAutoExecute ? 'claimed' : 'pending',
    execution_mode,
    governance_policy: policy,
    created_at: new Date().toISOString(),
  };
  let work_id: string | null = null;
  {
    const { data, error } = await supabase
      .from('agent_processing_queue')
      .insert(insertPayload)
      .select('id')
      .single();

    if (data && (data as any).id) {
      work_id = (data as any).id;
    } else if (error && /execution_mode|governance_policy|column/i.test(error.message || '')) {
      const fallbackInsert = { ...insertPayload } as any;
      delete fallbackInsert.execution_mode;
      delete fallbackInsert.governance_policy;
      const retry = await supabase
        .from('agent_processing_queue')
        .insert(fallbackInsert)
        .select('id')
        .single();
      if (retry.data && (retry.data as any).id) {
        work_id = (retry.data as any).id;
      } else {
        throw new Error(`Failed to create work entry: ${retry.error?.message || error.message}`);
      }
    } else if (error) {
      throw new Error(`Failed to create work entry: ${error.message}`);
    }
  }

  const workEntryId = work_id!;
  let proposal_id: string | undefined;

  if (canAutoExecute) {
    // Execute immediately
    await supabase
      .from('agent_processing_queue')
      .update({ processing_state: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', workEntryId);

    try {
      const result = await autoExecuteWork(supabase, request);
      await supabase
        .from('agent_processing_queue')
        .update({ processing_state: 'completed', completed_at: new Date().toISOString(), work_result: result })
        .eq('id', workEntryId);
      return {
        work_id: workEntryId,
        routing_decision: execution_mode as any,
        execution_mode: execution_mode as any,
        proposal_id,
        work_result: result,
        executed_immediately: true,
      };
    } catch (e: any) {
      await supabase
        .from('agent_processing_queue')
        .update({ processing_state: 'failed', error_message: e?.message || String(e) })
        .eq('id', workEntryId);
      throw e;
    }
  }

  if (execution_mode === 'create_proposal') {
    const nowIso = new Date().toISOString();

    const inferProposalKind = (): 'Extraction' | 'Edit' | 'Merge' | 'Attachment' => {
      const types = (request.work_payload.operations || []).map(o => o?.type);
      if (types.some(t => /Merge/i.test(t))) return 'Merge';
      if (types.some(t => /Attach|Relationship|Map/i.test(t))) return 'Attachment';
      if (types.some(t => /Create|Extract/i.test(t))) return 'Extraction';
      return 'Edit';
    };
    const origin = request.work_type === 'MANUAL_EDIT' ? 'human' : 'agent';

    const tryNew = await supabase
      .from('proposals')
      .insert({
        work_id: workEntryId,
        work_type: request.work_type,
        workspace_id: request.workspace_id,
        user_id: request.user_id,
        operations: request.work_payload.operations,
        confidence_score: request.work_payload.confidence_score,
        status: 'PROPOSED',
        created_at: nowIso,
      })
      .select('id')
      .single();

    if (tryNew.data && (tryNew.data as any).id) {
      proposal_id = (tryNew.data as any).id;
    } else {
      const fallback = await supabase
        .from('proposals')
        .insert({
          basket_id: request.work_payload.basket_id,
          workspace_id: request.workspace_id,
          proposal_kind: inferProposalKind(),
          origin,
          ops: request.work_payload.operations,
          provenance: request.work_payload.provenance || [],
          status: 'PROPOSED',
          created_at: nowIso,
          created_by: request.user_id,
        })
        .select('id')
        .single();

      if (fallback.error || !fallback.data) {
        const errMsg = fallback.error?.message || tryNew.error?.message || 'Unknown error';
        throw new Error(`Failed to create proposal: ${errMsg}`);
      }

      proposal_id = (fallback.data as any).id;
    }
  }

  return {
    work_id: workEntryId,
    routing_decision: execution_mode as any,
    execution_mode: execution_mode as any,
    proposal_id,
    executed_immediately: false,
  };
}

export default { routeWork };

async function autoExecuteWork(supabase: SupabaseClient, request: WorkRequest): Promise<any> {
  switch (request.work_type) {
    case 'MANUAL_EDIT':
      return executeManualEditOps(supabase, request);
    default:
      // For other types, we rely on workers; no-op here
      return { executed: false, note: 'No auto-executor for work_type' };
  }
}

async function executeManualEditOps(supabase: SupabaseClient, request: WorkRequest): Promise<any> {
  const { basket_id, operations } = request.work_payload || ({} as any);
  if (!basket_id || !operations || operations.length === 0) return { executed: true, counts: { total: 0 } };

  let archivedBlocks = 0;
  let redactedDumps = 0;
  let deprecatedItems = 0;
  let errors: Array<{ type: string; id?: string; error: string }> = [];

  // Execute sequentially to keep load predictable
  for (const op of operations) {
    const t = (op?.type || '').toString();
    const data = op?.data || {};
    try {
      if (t === 'ArchiveBlock' && data.block_id) {
        const { error } = await supabase.rpc('fn_archive_block', {
          p_basket_id: basket_id,
          p_block_id: data.block_id,
          p_actor_id: request.user_id,
        });
        if (error) throw new Error(error.message);
        archivedBlocks++;
      } else if (t === 'RedactDump' && data.dump_id) {
        const { error } = await supabase.rpc('fn_redact_dump', {
          p_basket_id: basket_id,
          p_dump_id: data.dump_id,
          p_scope: data.scope || 'full',
          p_reason: data.reason || 'bulk_purge',
          p_actor_id: request.user_id,
        });
        if (error) throw new Error(error.message);
        redactedDumps++;
      } else if (t === 'ArchiveContextItem' && data.context_item_id) {
        // Canon-compliant context item archival with tombstones and retention
        const { error } = await supabase.rpc('fn_archive_context_item', {
          p_basket_id: basket_id,
          p_context_item_id: data.context_item_id,
          p_actor_id: request.user_id,
        });
        if (error) throw new Error(error.message);
        deprecatedItems++;
      } else if (t === 'Delete' && (data.target_type === 'context_item') && data.target_id) {
        // Legacy support: redirect to ArchiveContextItem
        const { error } = await supabase.rpc('fn_archive_context_item', {
          p_basket_id: basket_id,
          p_context_item_id: data.target_id,
          p_actor_id: request.user_id,
        });
        if (error) throw new Error(error.message);
        deprecatedItems++;
      } else {
        // Unsupported op in auto path; record and continue
        errors.push({ type: t, id: data.block_id || data.dump_id || data.target_id, error: 'Unsupported operation for auto-exec' });
      }
    } catch (e: any) {
      errors.push({ type: t, id: data.block_id || data.dump_id || data.target_id, error: e?.message || String(e) });
    }
  }

  return {
    executed: true,
    counts: {
      total: operations.length,
      archivedBlocks,
      redactedDumps,
      deprecatedItems,
      errors: errors.length,
    },
    errors,
  };
}
