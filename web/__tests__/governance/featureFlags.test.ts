import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGovernanceFlags,
  shouldUseGovernance,
  isValidatorRequired,
  allowDirectSubstrateWrites,
  isGovernanceUIEnabled,
  getGovernanceStatus
} from '@/lib/governance/featureFlags';

describe('Governance Feature Flags', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.GOVERNANCE_ENABLED;
    delete process.env.VALIDATOR_REQUIRED;
    delete process.env.DIRECT_SUBSTRATE_WRITES;
    delete process.env.GOVERNANCE_UI_ENABLED;
    delete process.env.CASCADE_EVENTS_ENABLED;
  });

  describe('getGovernanceFlags', () => {
    it('should return default flags when no env vars set', () => {
      const flags = getGovernanceFlags();
      
      expect(flags).toEqual({
        governance_enabled: false,
        validator_required: false,
        direct_substrate_writes: true,
        governance_ui_enabled: false,
        cascade_events_enabled: true
      });
    });

    it('should override defaults with environment variables', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.VALIDATOR_REQUIRED = 'true';
      process.env.DIRECT_SUBSTRATE_WRITES = 'false';
      process.env.GOVERNANCE_UI_ENABLED = 'true';
      
      const flags = getGovernanceFlags();
      
      expect(flags.governance_enabled).toBe(true);
      expect(flags.validator_required).toBe(true);
      expect(flags.direct_substrate_writes).toBe(false);
      expect(flags.governance_ui_enabled).toBe(true);
      expect(flags.cascade_events_enabled).toBe(true); // Default preserved
    });

    it('should handle string boolean conversion', () => {
      process.env.GOVERNANCE_ENABLED = 'false';
      process.env.VALIDATOR_REQUIRED = 'invalid';  // Non-boolean string
      
      const flags = getGovernanceFlags();
      
      expect(flags.governance_enabled).toBe(false);
      expect(flags.validator_required).toBe(false); // Invalid strings become false
    });
  });

  describe('Convenience functions', () => {
    it('should return correct values based on flags', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.VALIDATOR_REQUIRED = 'true';
      process.env.DIRECT_SUBSTRATE_WRITES = 'false';
      process.env.GOVERNANCE_UI_ENABLED = 'true';
      
      expect(shouldUseGovernance()).toBe(true);
      expect(isValidatorRequired()).toBe(true);
      expect(allowDirectSubstrateWrites()).toBe(false);
      expect(isGovernanceUIEnabled()).toBe(true);
    });
  });

  describe('getGovernanceStatus', () => {
    it('should return disabled status by default', () => {
      const status = getGovernanceStatus();
      
      expect(status.status).toBe('disabled');
      expect(status.description).toBe('Governance not active - legacy substrate writes only');
      expect(status.flags.governance_enabled).toBe(false);
    });

    it('should return testing status with minimal governance', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      // Other flags remain false
      
      const status = getGovernanceStatus();
      
      expect(status.status).toBe('testing');
      expect(status.description).toBe('Governance enabled for testing - parallel to legacy writes');
    });

    it('should return partial status with UI enabled', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.GOVERNANCE_UI_ENABLED = 'true';
      // direct_substrate_writes still true (default)
      
      const status = getGovernanceStatus();
      
      expect(status.status).toBe('partial');
      expect(status.description).toBe('Governance UI active - some flows governed');
    });

    it('should return full status with complete governance', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.VALIDATOR_REQUIRED = 'true';
      process.env.DIRECT_SUBSTRATE_WRITES = 'false';
      
      const status = getGovernanceStatus();
      
      expect(status.status).toBe('full');
      expect(status.description).toBe('Full governance - all substrate writes governed');
    });
  });

  describe('Deployment scenarios', () => {
    it('should support safe rollout scenario', () => {
      // Scenario 1: Deploy with governance disabled
      const disabled = getGovernanceStatus();
      expect(disabled.status).toBe('disabled');
      
      // Scenario 2: Enable for testing
      process.env.GOVERNANCE_ENABLED = 'true';
      const testing = getGovernanceStatus();
      expect(testing.status).toBe('testing');
      
      // Scenario 3: Enable UI for partial governance
      process.env.GOVERNANCE_UI_ENABLED = 'true';
      const partial = getGovernanceStatus();
      expect(partial.status).toBe('partial');
      
      // Scenario 4: Full governance activation
      process.env.VALIDATOR_REQUIRED = 'true';
      process.env.DIRECT_SUBSTRATE_WRITES = 'false';
      const full = getGovernanceStatus();
      expect(full.status).toBe('full');
    });

    it('should maintain backward compatibility', () => {
      // Default state should preserve existing behavior
      expect(shouldUseGovernance()).toBe(false);
      expect(allowDirectSubstrateWrites()).toBe(true);
      expect(isValidatorRequired()).toBe(false);
      
      // Legacy systems should continue working
      const flags = getGovernanceFlags();
      expect(flags.direct_substrate_writes).toBe(true);
      expect(flags.governance_enabled).toBe(false);
    });
  });

  describe('Monitoring and observability', () => {
    it('should provide detailed flag information for monitoring', () => {
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.VALIDATOR_REQUIRED = 'true';
      
      const status = getGovernanceStatus();
      
      // Should include all flag details for monitoring dashboards
      expect(status.flags).toBeDefined();
      expect(status.status).toBeDefined();
      expect(status.description).toBeDefined();
      
      // Monitoring systems can check specific flags
      expect(status.flags.governance_enabled).toBe(true);
      expect(status.flags.validator_required).toBe(true);
    });
  });
});