/**
 * Server-side Workspace Governance Flag Evaluator
 * 
 * Replaces environment-level flags with workspace-scoped governance policies.
 * Provides per-entry-point routing decisions with environment fallback.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type EntryPoint =
  | 'onboarding_dump' 
  | 'manual_edit' 
  | 'document_edit'
  | 'reflection_suggestion' 
  | 'graph_action' 
  | 'timeline_restore';

export type EntryPointPolicy = 'proposal' | 'direct' | 'hybrid';

export type WorkspaceFlags = {
  // Global governance switches
  governance_enabled: boolean;
  validator_required: boolean;
  direct_substrate_writes: boolean;
  governance_ui_enabled: boolean;
  
  // Per-entry-point policies
  ep: Record<EntryPoint, EntryPointPolicy>;
  
  // Default risk settings
  default_blast_radius: 'Local' | 'Scoped' | 'Global';
  
  // Source tracking for debugging
  source: 'workspace_database' | 'environment_fallback';
};

/**
 * Environment defaults used when no workspace-specific settings exist.
 * Provides safe fallback behavior.
 */
const ENV_DEFAULTS: WorkspaceFlags = {
  governance_enabled: process.env.GOVERNANCE_ENABLED === 'true',
  validator_required: process.env.GOVERNANCE_VALIDATOR_REQUIRED === 'true',
  direct_substrate_writes: process.env.GOVERNANCE_DIRECT_WRITES !== 'false',
  governance_ui_enabled: process.env.GOVERNANCE_UI_ENABLED === 'true',
  
  ep: {
    onboarding_dump: (process.env.EP_ONBOARDING_DUMP as EntryPointPolicy) || 'proposal',
    manual_edit: (process.env.EP_MANUAL_EDIT as EntryPointPolicy) || 'proposal',
    document_edit: (process.env.EP_DOCUMENT_EDIT as EntryPointPolicy) || 'proposal',
    reflection_suggestion: (process.env.EP_REFLECTION_SUGGESTION as EntryPointPolicy) || 'proposal',
    graph_action: (process.env.EP_GRAPH_ACTION as EntryPointPolicy) || 'proposal',
    timeline_restore: (process.env.EP_TIMELINE_RESTORE as EntryPointPolicy) || 'proposal'
  },
  
  default_blast_radius: (process.env.DEFAULT_BLAST_RADIUS as 'Local' | 'Scoped' | 'Global') || 'Scoped',
  source: 'environment_fallback'
};

/**
 * Get comprehensive governance flags for a workspace.
 * Uses workspace database settings with environment fallback.
 */
export async function getWorkspaceFlags(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceFlags> {
  try {
    // Call database function for flag evaluation
    const { data: flagsData, error } = await supabase.rpc('get_workspace_governance_flags', {
      p_workspace_id: workspaceId
    });

    if (error) {
      console.warn('Workspace flags query failed, using env defaults:', error);
      return ENV_DEFAULTS;
    }

    if (!flagsData) {
      return ENV_DEFAULTS;
    }

    // Transform database response to WorkspaceFlags
    return {
      governance_enabled: flagsData.governance_enabled,
      validator_required: flagsData.validator_required,
      direct_substrate_writes: flagsData.direct_substrate_writes,
      governance_ui_enabled: flagsData.governance_ui_enabled,
      
      ep: {
        onboarding_dump: flagsData.ep_onboarding_dump,
        manual_edit: flagsData.ep_manual_edit,
        document_edit: flagsData.ep_document_edit,
        reflection_suggestion: flagsData.ep_reflection_suggestion,
        graph_action: flagsData.ep_graph_action,
        timeline_restore: flagsData.ep_timeline_restore
      },
      
      default_blast_radius: flagsData.default_blast_radius,
      source: flagsData.source || 'workspace_database'
    };

  } catch (error) {
    console.warn('Workspace flags evaluation failed, using env defaults:', error);
    return ENV_DEFAULTS;
  }
}

/**
 * Get governance status for a workspace (for monitoring/debugging).
 */
export async function getWorkspaceGovernanceStatus(
  supabase: SupabaseClient,
  workspaceId: string
) {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  
  let status: 'disabled' | 'testing' | 'partial' | 'full' = 'disabled';
  
  if (flags.governance_enabled && flags.validator_required && !flags.direct_substrate_writes) {
    status = 'full';
  } else if (flags.governance_enabled && flags.governance_ui_enabled) {
    status = 'partial';
  } else if (flags.governance_enabled) {
    status = 'testing';
  }
  
  return {
    status,
    flags,
    workspace_id: workspaceId,
    description: {
      disabled: 'Governance not active - legacy substrate writes only',
      testing: 'Governance enabled for testing - parallel to legacy writes',
      partial: 'Governance UI active - some flows governed', 
      full: 'Full governance - all substrate writes governed'
    }[status],
    timestamp: new Date().toISOString(),
    canon_version: 'v2.1'
  };
}

/**
 * Convenience functions for common flag checks.
 */
export async function shouldUseGovernance(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  return flags.governance_enabled;
}

export async function isValidatorRequired(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  return flags.validator_required;
}

export async function allowDirectSubstrateWrites(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  return flags.direct_substrate_writes;
}

export async function isGovernanceUIEnabled(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  return flags.governance_ui_enabled;
}

/**
 * Get entry-point specific policy for a workspace.
 */
export async function getEntryPointPolicy(
  supabase: SupabaseClient,
  workspaceId: string,
  entryPoint: EntryPoint
): Promise<EntryPointPolicy> {
  const flags = await getWorkspaceFlags(supabase, workspaceId);
  return flags.ep[entryPoint];
}