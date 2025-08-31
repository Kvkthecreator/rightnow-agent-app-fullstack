/**
 * Client-side Governance Feature Flags (v2.1)
 * 
 * Client hook that fetches workspace-scoped governance configuration.
 * Replaces environment-only flags with workspace-aware policies.
 */

import { useState, useEffect } from 'react';

export interface GovernanceFlags {
  governance_enabled: boolean;
  validator_required: boolean;
  direct_substrate_writes: boolean;
  governance_ui_enabled: boolean;
  cascade_events_enabled: boolean;
}

export interface WorkspaceGovernanceStatus {
  status: 'disabled' | 'testing' | 'partial' | 'full';
  flags: GovernanceFlags;
  workspace_id: string;
  description: string;
  timestamp: string;
  canon_version: string;
}

// Legacy environment-only flags (deprecated - use useWorkspaceGovernance hook)
const DEFAULT_FLAGS: GovernanceFlags = {
  governance_enabled: false,
  validator_required: false, 
  direct_substrate_writes: true,
  governance_ui_enabled: false,
  cascade_events_enabled: true
};

/**
 * DEPRECATED: Environment-only flags (use useWorkspaceGovernance instead)
 */
export function getGovernanceFlags(): GovernanceFlags {
  console.warn('getGovernanceFlags() is deprecated - use useWorkspaceGovernance() hook for workspace-aware governance');
  
  const envFlags: Partial<GovernanceFlags> = {};
  
  if (typeof window !== 'undefined') {
    // Client-side: return defaults and warn
    console.warn('Client-side environment access deprecated - use server API');
    return DEFAULT_FLAGS;
  }
  
  // Server-side environment fallback
  if (process.env.GOVERNANCE_ENABLED !== undefined) {
    envFlags.governance_enabled = process.env.GOVERNANCE_ENABLED === 'true';
  }
  
  if (process.env.VALIDATOR_REQUIRED !== undefined) {
    envFlags.validator_required = process.env.VALIDATOR_REQUIRED === 'true';
  }
  
  if (process.env.DIRECT_SUBSTRATE_WRITES !== undefined) {
    envFlags.direct_substrate_writes = process.env.DIRECT_SUBSTRATE_WRITES === 'true';
  }
  
  if (process.env.GOVERNANCE_UI_ENABLED !== undefined) {
    envFlags.governance_ui_enabled = process.env.GOVERNANCE_UI_ENABLED === 'true';
  }
  
  if (process.env.CASCADE_EVENTS_ENABLED !== undefined) {
    envFlags.cascade_events_enabled = process.env.CASCADE_EVENTS_ENABLED === 'true';
  }
  
  return {
    ...DEFAULT_FLAGS,
    ...envFlags
  };
}

/**
 * NEW: Workspace-aware governance hook
 * Fetches governance configuration from server API.
 */
export function useWorkspaceGovernance() {
  const [status, setStatus] = useState<WorkspaceGovernanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGovernanceStatus() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/governance/status');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch governance status: ${response.status}`);
        }
        
        const statusData = await response.json();
        setStatus(statusData);
        
      } catch (err) {
        console.error('Failed to fetch workspace governance status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to environment defaults
        setStatus({
          status: 'disabled',
          flags: DEFAULT_FLAGS,
          workspace_id: 'unknown',
          description: 'Failed to load governance status - using defaults',
          timestamp: new Date().toISOString(),
          canon_version: 'v2.1'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchGovernanceStatus();
  }, []);

  return {
    status: status?.status || 'disabled',
    flags: status?.flags || DEFAULT_FLAGS,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger useEffect
      setStatus(null);
    }
  };
}

/**
 * Check if governance workflow should be used for new proposals.
 */
export function shouldUseGovernance(): boolean {
  const flags = getGovernanceFlags();
  return flags.governance_enabled;
}

/**
 * Check if agent validation is required for proposals.
 */
export function isValidatorRequired(): boolean {
  const flags = getGovernanceFlags();
  return flags.validator_required;
}

/**
 * Check if direct substrate writes are still allowed (legacy mode).
 */
export function allowDirectSubstrateWrites(): boolean {
  const flags = getGovernanceFlags();
  return flags.direct_substrate_writes;
}

/**
 * Check if governance UI should be shown to users.
 */
export function isGovernanceUIEnabled(): boolean {
  const flags = getGovernanceFlags();
  return flags.governance_ui_enabled;
}

/**
 * Get governance deployment status for monitoring.
 */
export function getGovernanceStatus() {
  const flags = getGovernanceFlags();
  
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
    description: {
      disabled: 'Governance not active - legacy substrate writes only',
      testing: 'Governance enabled for testing - parallel to legacy writes',
      partial: 'Governance UI active - some flows governed', 
      full: 'Full governance - all substrate writes governed'
    }[status]
  };
}