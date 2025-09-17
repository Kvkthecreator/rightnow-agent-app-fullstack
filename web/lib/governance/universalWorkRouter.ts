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

  // Create work entry in canonical queue (with backward‑compat fallbacks)
  let work_id: string | null = null;
  {
    const { data, error } = await supabase
      .from('agent_processing_queue')
      .insert({
        work_type: request.work_type,
        work_payload: request.work_payload,
        workspace_id: request.workspace_id,
        user_id: request.user_id,
        priority: priorityToInteger(request.priority),
        processing_state: execution_mode === 'auto_execute' ? 'claimed' : 'pending',
        execution_mode, // may not exist on older schemas
        governance_policy: policy, // may not exist on older schemas
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (data && (data as any).id) {
      work_id = (data as any).id;
    } else if (error && /execution_mode|governance_policy|column/i.test(error.message || '')) {
      // Retry without newer columns
      const retry = await supabase
        .from('agent_processing_queue')
        .insert({
          work_type: request.work_type,
          work_payload: request.work_payload,
          workspace_id: request.workspace_id,
          user_id: request.user_id,
          priority: priorityToInteger(request.priority),
          processing_state: execution_mode === 'auto_execute' ? 'claimed' : 'pending',
          created_at: new Date().toISOString()
        })
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

  // Non-null by here
  const workEntryId = work_id!;
  let proposal_id: string | undefined;

  // Handle execution based on mode
  if (execution_mode === 'auto_execute') {
    // Execute immediately - trigger worker
    await supabase
      .from('agent_processing_queue')
      .update({ processing_state: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', workEntryId);
  } else {
    // Create proposal for review
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        work_id: workEntryId,
        work_type: request.work_type,
        workspace_id: request.workspace_id,
        user_id: request.user_id,
        operations: request.work_payload.operations,
        confidence_score: request.work_payload.confidence_score,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Failed to create proposal: ${proposalError?.message || 'Unknown error'}`);
    }

    proposal_id = proposal.id;
  }

  return {
    work_id: workEntryId,
    routing_decision: execution_mode as any,
    execution_mode: execution_mode as any,
    proposal_id
  };
}

export default { routeWork };
