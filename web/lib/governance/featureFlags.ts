/**
 * Governance Feature Flags
 * 
 * Safe rollout controls for governance system deployment.
 * Allows gradual migration from direct substrate writes to governed proposals.
 */

interface GovernanceFlags {
  governance_enabled: boolean;
  validator_required: boolean;
  direct_substrate_writes: boolean;
  governance_ui_enabled: boolean;
  cascade_events_enabled: boolean;
}

const DEFAULT_FLAGS: GovernanceFlags = {
  governance_enabled: false,
  validator_required: false, 
  direct_substrate_writes: true,
  governance_ui_enabled: false,
  cascade_events_enabled: true
};

/**
 * Get governance feature flags from environment.
 * Provides safe defaults with explicit override capability.
 */
export function getGovernanceFlags(): GovernanceFlags {
  // Check for explicit environment overrides
  const envFlags: Partial<GovernanceFlags> = {};
  
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