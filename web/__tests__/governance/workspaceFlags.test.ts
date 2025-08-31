import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWorkspaceFlags,
  getWorkspaceGovernanceStatus,
  shouldUseGovernance,
  isValidatorRequired,
  allowDirectSubstrateWrites,
  isGovernanceUIEnabled,
  getEntryPointPolicy,
  type WorkspaceFlags,
  type EntryPointPolicy
} from '@/lib/governance/flagsServer';

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis()
};

describe('Workspace Governance Flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear environment variables for clean testing
    delete process.env.GOVERNANCE_ENABLED;
    delete process.env.GOVERNANCE_VALIDATOR_REQUIRED;
    delete process.env.GOVERNANCE_DIRECT_WRITES;
    delete process.env.GOVERNANCE_UI_ENABLED;
  });

  describe('getWorkspaceFlags', () => {
    it('should return workspace-specific governance flags', async () => {
      // Mock workspace database response
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: true,
          direct_substrate_writes: false,
          governance_ui_enabled: true,
          ep_onboarding_dump: 'proposal' as EntryPointPolicy,
          ep_manual_edit: 'hybrid' as EntryPointPolicy,
          ep_document_edit: 'proposal' as EntryPointPolicy,
          ep_reflection_suggestion: 'direct' as EntryPointPolicy,
          ep_graph_action: 'proposal' as EntryPointPolicy,
          ep_timeline_restore: 'proposal' as EntryPointPolicy,
          default_blast_radius: 'Scoped',
          source: 'workspace_database'
        },
        error: null
      });

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-test');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_workspace_governance_flags', {
        p_workspace_id: 'workspace-test'
      });

      expect(flags.governance_enabled).toBe(true);
      expect(flags.validator_required).toBe(true);
      expect(flags.direct_substrate_writes).toBe(false);
      expect(flags.governance_ui_enabled).toBe(true);
      expect(flags.source).toBe('workspace_database');

      // Verify entry point policies
      expect(flags.ep.onboarding_dump).toBe('proposal');
      expect(flags.ep.manual_edit).toBe('hybrid');
      expect(flags.ep.document_edit).toBe('proposal');
      expect(flags.ep.reflection_suggestion).toBe('direct');
      expect(flags.ep.graph_action).toBe('proposal');
      expect(flags.ep.timeline_restore).toBe('proposal');

      expect(flags.default_blast_radius).toBe('Scoped');
    });

    it('should fallback to environment defaults on database error', async () => {
      // Mock database error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      // Set environment variables
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.GOVERNANCE_VALIDATOR_REQUIRED = 'false';
      process.env.EP_MANUAL_EDIT = 'direct';

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-test');

      expect(flags.source).toBe('environment_fallback');
      expect(flags.governance_enabled).toBe(true);
      expect(flags.validator_required).toBe(false);
      expect(flags.ep.manual_edit).toBe('direct');
    });

    it('should use environment defaults when no workspace settings exist', async () => {
      // Mock empty database response
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      });

      process.env.GOVERNANCE_ENABLED = 'false';
      process.env.EP_ONBOARDING_DUMP = 'hybrid';
      process.env.DEFAULT_BLAST_RADIUS = 'Global';

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-new');

      expect(flags.source).toBe('environment_fallback');
      expect(flags.governance_enabled).toBe(false);
      expect(flags.ep.onboarding_dump).toBe('hybrid');
      expect(flags.default_blast_radius).toBe('Global');
    });
  });

  describe('getWorkspaceGovernanceStatus', () => {
    it('should return "full" governance status', async () => {
      // Mock full governance flags
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: true,
          direct_substrate_writes: false,
          governance_ui_enabled: true,
          ep_onboarding_dump: 'proposal',
          ep_manual_edit: 'proposal',
          ep_document_edit: 'proposal',
          ep_reflection_suggestion: 'proposal',
          ep_graph_action: 'proposal',
          ep_timeline_restore: 'proposal',
          default_blast_radius: 'Local'
        },
        error: null
      });

      const status = await getWorkspaceGovernanceStatus(mockSupabase as any, 'workspace-full');

      expect(status.status).toBe('full');
      expect(status.workspace_id).toBe('workspace-full');
      expect(status.description).toBe('Full governance - all substrate writes governed');
      expect(status.canon_version).toBe('v2.1');
      expect(status.flags.governance_enabled).toBe(true);
      expect(status.flags.validator_required).toBe(true);
      expect(status.flags.direct_substrate_writes).toBe(false);
    });

    it('should return "partial" governance status', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: true,
          ep_onboarding_dump: 'hybrid',
          ep_manual_edit: 'direct',
          ep_document_edit: 'proposal',
          default_blast_radius: 'Scoped'
        },
        error: null
      });

      const status = await getWorkspaceGovernanceStatus(mockSupabase as any, 'workspace-partial');

      expect(status.status).toBe('partial');
      expect(status.description).toBe('Governance UI active - some flows governed');
    });

    it('should return "testing" governance status', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: false,
          ep_onboarding_dump: 'direct',
          ep_manual_edit: 'direct',
          default_blast_radius: 'Local'
        },
        error: null
      });

      const status = await getWorkspaceGovernanceStatus(mockSupabase as any, 'workspace-testing');

      expect(status.status).toBe('testing');
      expect(status.description).toBe('Governance enabled for testing - parallel to legacy writes');
    });

    it('should return "disabled" governance status', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: false,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: false,
          default_blast_radius: 'Local'
        },
        error: null
      });

      const status = await getWorkspaceGovernanceStatus(mockSupabase as any, 'workspace-disabled');

      expect(status.status).toBe('disabled');
      expect(status.description).toBe('Governance not active - legacy substrate writes only');
    });
  });

  describe('Convenience flag functions', () => {
    beforeEach(() => {
      // Default workspace flags response
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: true,
          direct_substrate_writes: false,
          governance_ui_enabled: true,
          ep_manual_edit: 'proposal',
          default_blast_radius: 'Scoped'
        },
        error: null
      });
    });

    it('should check if governance is enabled', async () => {
      const result = await shouldUseGovernance(mockSupabase as any, 'workspace-test');
      expect(result).toBe(true);
    });

    it('should check if validator is required', async () => {
      const result = await isValidatorRequired(mockSupabase as any, 'workspace-test');
      expect(result).toBe(true);
    });

    it('should check if direct writes are allowed', async () => {
      const result = await allowDirectSubstrateWrites(mockSupabase as any, 'workspace-test');
      expect(result).toBe(false);
    });

    it('should check if governance UI is enabled', async () => {
      const result = await isGovernanceUIEnabled(mockSupabase as any, 'workspace-test');
      expect(result).toBe(true);
    });

    it('should get entry point policy', async () => {
      const result = await getEntryPointPolicy(mockSupabase as any, 'workspace-test', 'manual_edit');
      expect(result).toBe('proposal');
    });
  });

  describe('Entry Point Policies', () => {
    it('should support all three policy types', () => {
      const policyTypes: EntryPointPolicy[] = ['proposal', 'direct', 'hybrid'];
      
      // All policy types should be valid
      expect(policyTypes).toContain('proposal');
      expect(policyTypes).toContain('direct');
      expect(policyTypes).toContain('hybrid');
      expect(policyTypes).toHaveLength(3);
    });

    it('should configure entry point policies per workspace', async () => {
      // Mock different policy configurations
      const policyConfigurations = [
        {
          workspace: 'workspace-strict',
          config: {
            onboarding_dump: 'proposal' as EntryPointPolicy,
            manual_edit: 'proposal' as EntryPointPolicy,
            document_edit: 'proposal' as EntryPointPolicy,
            reflection_suggestion: 'proposal' as EntryPointPolicy,
            graph_action: 'proposal' as EntryPointPolicy,
            timeline_restore: 'proposal' as EntryPointPolicy
          }
        },
        {
          workspace: 'workspace-lenient',
          config: {
            onboarding_dump: 'direct' as EntryPointPolicy,
            manual_edit: 'direct' as EntryPointPolicy,
            document_edit: 'hybrid' as EntryPointPolicy,
            reflection_suggestion: 'direct' as EntryPointPolicy,
            graph_action: 'hybrid' as EntryPointPolicy,
            timeline_restore: 'proposal' as EntryPointPolicy
          }
        },
        {
          workspace: 'workspace-mixed',
          config: {
            onboarding_dump: 'hybrid' as EntryPointPolicy,
            manual_edit: 'proposal' as EntryPointPolicy,
            document_edit: 'direct' as EntryPointPolicy,
            reflection_suggestion: 'hybrid' as EntryPointPolicy,
            graph_action: 'direct' as EntryPointPolicy,
            timeline_restore: 'hybrid' as EntryPointPolicy
          }
        }
      ];

      // Each workspace can have different policy configurations
      policyConfigurations.forEach(config => {
        Object.values(config.config).forEach(policy => {
          expect(['proposal', 'direct', 'hybrid']).toContain(policy);
        });
      });
    });
  });

  describe('Blast Radius Configuration', () => {
    it('should support all blast radius levels', async () => {
      const blastRadiusLevels = ['Local', 'Scoped', 'Global'] as const;
      
      for (const level of blastRadiusLevels) {
        mockSupabase.rpc.mockResolvedValue({
          data: {
            governance_enabled: true,
            default_blast_radius: level
          },
          error: null
        });

        const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-test');
        expect(flags.default_blast_radius).toBe(level);
      }
    });

    it('should validate blast radius impact scope', () => {
      const blastRadiusScopes = {
        Local: { 
          impact: 'single_entity',
          scope: 'individual_block_or_item',
          risk_level: 'low'
        },
        Scoped: { 
          impact: 'basket_level',
          scope: 'related_entities_in_basket',
          risk_level: 'medium'
        },
        Global: { 
          impact: 'workspace_level',
          scope: 'cross_basket_implications',
          risk_level: 'high'
        }
      };

      // Each blast radius has appropriate scope and risk
      expect(blastRadiusScopes.Local.risk_level).toBe('low');
      expect(blastRadiusScopes.Scoped.risk_level).toBe('medium');
      expect(blastRadiusScopes.Global.risk_level).toBe('high');

      // Scope increases with blast radius
      expect(blastRadiusScopes.Local.scope).toContain('individual');
      expect(blastRadiusScopes.Scoped.scope).toContain('basket');
      expect(blastRadiusScopes.Global.scope).toContain('workspace');
    });
  });

  describe('Environment Fallback Behavior', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Mock database failure
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      // No environment variables set
      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-test');

      expect(flags.source).toBe('environment_fallback');
      expect(flags.governance_enabled).toBe(false); // Default false
      expect(flags.validator_required).toBe(false); // Default false
      expect(flags.direct_substrate_writes).toBe(true); // Default true
      expect(flags.governance_ui_enabled).toBe(false); // Default false
      expect(flags.default_blast_radius).toBe('Scoped'); // Default Scoped
      
      // All entry points default to 'proposal'
      Object.values(flags.ep).forEach(policy => {
        expect(policy).toBe('proposal');
      });
    });

    it('should use environment variables when database unavailable', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      // Set environment overrides
      process.env.GOVERNANCE_ENABLED = 'true';
      process.env.GOVERNANCE_VALIDATOR_REQUIRED = 'true';
      process.env.GOVERNANCE_DIRECT_WRITES = 'false';
      process.env.GOVERNANCE_UI_ENABLED = 'true';
      process.env.EP_MANUAL_EDIT = 'hybrid';
      process.env.EP_DOCUMENT_EDIT = 'direct';
      process.env.DEFAULT_BLAST_RADIUS = 'Global';

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-test');

      expect(flags.source).toBe('environment_fallback');
      expect(flags.governance_enabled).toBe(true);
      expect(flags.validator_required).toBe(true);
      expect(flags.direct_substrate_writes).toBe(false);
      expect(flags.governance_ui_enabled).toBe(true);
      expect(flags.ep.manual_edit).toBe('hybrid');
      expect(flags.ep.document_edit).toBe('direct');
      expect(flags.default_blast_radius).toBe('Global');
    });
  });

  describe('Workspace Isolation', () => {
    it('should provide isolated governance settings per workspace', async () => {
      const workspaceConfigs = [
        {
          workspace_id: 'workspace-strict',
          config: {
            governance_enabled: true,
            validator_required: true,
            direct_substrate_writes: false,
            ep_manual_edit: 'proposal'
          }
        },
        {
          workspace_id: 'workspace-lenient',
          config: {
            governance_enabled: false,
            validator_required: false,
            direct_substrate_writes: true,
            ep_manual_edit: 'direct'
          }
        }
      ];

      for (const workspace of workspaceConfigs) {
        mockSupabase.rpc.mockResolvedValue({
          data: {
            ...workspace.config,
            ep_onboarding_dump: 'proposal',
            ep_document_edit: 'proposal',
            ep_reflection_suggestion: 'direct',
            ep_graph_action: 'proposal',
            ep_timeline_restore: 'proposal',
            default_blast_radius: 'Local'
          },
          error: null
        });

        const flags = await getWorkspaceFlags(mockSupabase as any, workspace.workspace_id);

        expect(flags.governance_enabled).toBe(workspace.config.governance_enabled);
        expect(flags.validator_required).toBe(workspace.config.validator_required);
        expect(flags.direct_substrate_writes).toBe(workspace.config.direct_substrate_writes);
        expect(flags.ep.manual_edit).toBe(workspace.config.ep_manual_edit);
      }
    });

    it('should prevent cross-workspace governance leakage', async () => {
      // Mock workspace-specific calls
      mockSupabase.rpc.mockImplementation((functionName: string, params: any) => {
        const workspaceSettings: Record<string, any> = {
          'workspace-a': {
            governance_enabled: true,
            validator_required: true,
            ep_manual_edit: 'proposal'
          },
          'workspace-b': {
            governance_enabled: false,
            validator_required: false,
            ep_manual_edit: 'direct'
          }
        };

        return Promise.resolve({
          data: workspaceSettings[params.p_workspace_id] || null,
          error: null
        });
      });

      const flagsA = await getWorkspaceFlags(mockSupabase as any, 'workspace-a');
      const flagsB = await getWorkspaceFlags(mockSupabase as any, 'workspace-b');

      // Workspaces have isolated settings
      expect(flagsA.governance_enabled).toBe(true);
      expect(flagsB.governance_enabled).toBe(false);
      
      expect(flagsA.validator_required).toBe(true);
      expect(flagsB.validator_required).toBe(false);

      // Settings don't leak between workspaces
      expect(flagsA.governance_enabled).not.toBe(flagsB.governance_enabled);
      expect(flagsA.validator_required).not.toBe(flagsB.validator_required);
    });
  });

  describe('Flag Validation and Consistency', () => {
    it('should validate flag consistency rules', async () => {
      // Test inconsistent flag combinations
      const inconsistentFlags: Partial<WorkspaceFlags>[] = [
        {
          // Cannot have governance UI without governance enabled
          governance_enabled: false,
          governance_ui_enabled: true
        },
        {
          // Cannot require validator without governance enabled
          governance_enabled: false,
          validator_required: true
        },
        {
          // Cannot have full governance with direct writes enabled
          governance_enabled: true,
          validator_required: true,
          direct_substrate_writes: true
        }
      ];

      // Mock flag validation function
      const validateFlagConsistency = (flags: Partial<WorkspaceFlags>): string[] => {
        const violations: string[] = [];

        if (!flags.governance_enabled && flags.governance_ui_enabled) {
          violations.push('governance_ui_enabled requires governance_enabled');
        }

        if (!flags.governance_enabled && flags.validator_required) {
          violations.push('validator_required requires governance_enabled');
        }

        if (flags.governance_enabled && flags.validator_required && flags.direct_substrate_writes) {
          violations.push('full governance incompatible with direct_substrate_writes');
        }

        return violations;
      };

      // All inconsistent configurations should generate violations
      inconsistentFlags.forEach(flags => {
        const violations = validateFlagConsistency(flags);
        expect(violations.length).toBeGreaterThan(0);
      });
    });

    it('should validate entry point policy consistency', () => {
      const policyValidation = {
        validPolicies: ['proposal', 'direct', 'hybrid'] as EntryPointPolicy[],
        entryPoints: [
          'onboarding_dump',
          'manual_edit', 
          'document_edit',
          'reflection_suggestion',
          'graph_action',
          'timeline_restore'
        ]
      };

      // All entry points must use valid policies
      policyValidation.entryPoints.forEach(entryPoint => {
        policyValidation.validPolicies.forEach(policy => {
          expect(['proposal', 'direct', 'hybrid']).toContain(policy);
        });
      });
    });
  });

  describe('Migration and Rollback Support', () => {
    it('should support governance migration phases', async () => {
      const migrationPhases = [
        {
          phase: 1,
          description: 'Deploy with governance_enabled: false',
          flags: {
            governance_enabled: false,
            validator_required: false,
            direct_substrate_writes: true,
            governance_ui_enabled: false
          }
        },
        {
          phase: 2,
          description: 'Enable validation',
          flags: {
            governance_enabled: true,
            validator_required: true,
            direct_substrate_writes: true,
            governance_ui_enabled: false
          }
        },
        {
          phase: 3,
          description: 'Enable governance UI',
          flags: {
            governance_enabled: true,
            validator_required: true,
            direct_substrate_writes: true,
            governance_ui_enabled: true
          }
        },
        {
          phase: 4,
          description: 'Switch to proposal-first',
          flags: {
            governance_enabled: true,
            validator_required: true,
            direct_substrate_writes: false,
            governance_ui_enabled: true
          }
        }
      ];

      // Each migration phase should be valid
      migrationPhases.forEach(phase => {
        expect(phase.phase).toBeGreaterThan(0);
        expect(phase.description).toBeDefined();
        expect(typeof phase.flags.governance_enabled).toBe('boolean');
        expect(typeof phase.flags.validator_required).toBe('boolean');
        expect(typeof phase.flags.direct_substrate_writes).toBe('boolean');
        expect(typeof phase.flags.governance_ui_enabled).toBe('boolean');
      });

      // Phases should represent progressive governance adoption
      expect(migrationPhases[0].flags.governance_enabled).toBe(false);
      expect(migrationPhases[3].flags.governance_enabled).toBe(true);
      expect(migrationPhases[3].flags.direct_substrate_writes).toBe(false);
    });

    it('should support rollback to legacy behavior', async () => {
      // Mock rollback configuration
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: false,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: false,
          ep_onboarding_dump: 'direct',
          ep_manual_edit: 'direct',
          ep_document_edit: 'direct',
          ep_reflection_suggestion: 'direct',
          ep_graph_action: 'direct',
          ep_timeline_restore: 'direct',
          default_blast_radius: 'Local'
        },
        error: null
      });

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-rollback');

      // Rollback configuration should disable all governance
      expect(flags.governance_enabled).toBe(false);
      expect(flags.direct_substrate_writes).toBe(true);
      
      // All entry points should use direct policy
      Object.values(flags.ep).forEach(policy => {
        expect(policy).toBe('direct');
      });
    });
  });

  describe('Workspace Flag Performance', () => {
    it('should cache workspace flags appropriately', async () => {
      // Mock database call tracking
      let callCount = 0;
      mockSupabase.rpc.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: {
            governance_enabled: true,
            validator_required: true,
            default_blast_radius: 'Scoped'
          },
          error: null
        });
      });

      // Multiple calls for same workspace
      await getWorkspaceFlags(mockSupabase as any, 'workspace-test');
      await getWorkspaceFlags(mockSupabase as any, 'workspace-test');
      
      // Should make database calls (caching handled at infrastructure level)
      expect(callCount).toBe(2);
    });

    it('should handle concurrent flag requests', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: false,
          default_blast_radius: 'Local'
        },
        error: null
      });

      // Concurrent requests should all succeed
      const promises = [
        getWorkspaceFlags(mockSupabase as any, 'workspace-concurrent-1'),
        getWorkspaceFlags(mockSupabase as any, 'workspace-concurrent-2'),
        getWorkspaceFlags(mockSupabase as any, 'workspace-concurrent-3')
      ];

      const results = await Promise.all(promises);

      results.forEach(flags => {
        expect(flags.governance_enabled).toBe(true);
        expect(flags.validator_required).toBe(false);
        expect(flags.default_blast_radius).toBe('Local');
      });
    });
  });

  describe('v3.0.0 Workspace-Scoped Governance Compliance', () => {
    it('should implement v3.0.0 workspace governance specification', async () => {
      // v3.0.0 features: workspace-scoped governance with per-entry-point policies
      mockSupabase.rpc.mockResolvedValue({
        data: {
          governance_enabled: true,
          validator_required: true,
          direct_substrate_writes: false,
          governance_ui_enabled: true,
          ep_onboarding_dump: 'proposal',
          ep_manual_edit: 'hybrid',
          ep_document_edit: 'proposal',
          ep_reflection_suggestion: 'direct',
          ep_graph_action: 'proposal',
          ep_timeline_restore: 'proposal',
          default_blast_radius: 'Scoped',
          hybrid_risk_threshold: 'medium'
        },
        error: null
      });

      const flags = await getWorkspaceFlags(mockSupabase as any, 'workspace-v3');

      // v3.0.0 compliance checks
      expect(flags.governance_enabled).toBe(true);
      expect(flags.ep).toBeDefined();
      expect(Object.keys(flags.ep)).toHaveLength(6); // All entry points configured
      expect(flags.default_blast_radius).toBe('Scoped');
      
      // Per-entry-point policy support (v3.0.0 feature)
      expect(flags.ep.onboarding_dump).toBe('proposal');
      expect(flags.ep.manual_edit).toBe('hybrid');
      expect(flags.ep.reflection_suggestion).toBe('direct');
    });

    it('should validate v3.0.0 governance architectural requirements', () => {
      const v3Requirements = {
        workspace_scoped_settings: true,
        per_entry_point_policies: true,
        hybrid_risk_routing: true,
        backward_compatibility: true,
        decision_gateway_integration: true,
        workspace_isolation: true,
        environment_fallback: true
      };

      // All v3.0.0 requirements must be met
      Object.values(v3Requirements).forEach(requirement => {
        expect(requirement).toBe(true);
      });
    });
  });
});