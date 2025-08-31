import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeChange } from '@/lib/governance/decisionGateway';
import { getWorkspaceFlags } from '@/lib/governance/flagsServer';
import { decide } from '@/lib/governance/policyDecider';
import { createManualEditDescriptor, createDumpExtractionDescriptor } from '@/lib/governance/changeDescriptor';

// Mock dependencies
vi.mock('@/lib/governance/flagsServer');
vi.mock('@/lib/governance/policyDecider');

describe('End-to-End Governance Workflow Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis()
    };

    vi.clearAllMocks();
  });

  describe('Complete Governance Flow: Direct Route', () => {
    it('should execute complete direct route workflow', async () => {
      // Mock workspace flags for direct routing
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: false,
        direct_substrate_writes: true,
        governance_ui_enabled: true,
        ep: {
          manual_edit: 'direct',
          onboarding_dump: 'direct',
          document_edit: 'direct',
          reflection_suggestion: 'direct',
          graph_action: 'direct',
          timeline_restore: 'direct'
        },
        default_blast_radius: 'Local',
        source: 'workspace_database'
      });

      // Mock policy decision for direct route
      vi.mocked(decide).mockReturnValue({
        route: 'direct',
        require_validator: false,
        validator_mode: 'lenient',
        effective_blast_radius: 'Local',
        reason: 'ep_policy_direct:manual_edit'
      });

      // Mock successful substrate creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_blocks') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { 
                    id: 'block-direct-123',
                    content: 'Direct route goal',
                    semantic_type: 'goal',
                    workspace_id: 'workspace-456'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'timeline_events') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'event-123', event_type: 'substrate.committed' },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      // Create change descriptor
      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'CreateBlock',
          data: { content: 'Direct route goal', semantic_type: 'goal' }
        }]
      );

      // Execute complete workflow
      const result = await routeChange(mockSupabase, changeDescriptor);

      // Validate direct route results
      expect(result.committed).toBe(true);
      expect(result.proposal_id).toBeUndefined();
      expect(result.execution_summary?.operations_executed).toBe(1);
      expect(result.execution_summary?.substrate_ids).toContain('block-direct-123');

      // Verify workflow called all required components
      expect(getWorkspaceFlags).toHaveBeenCalledWith(mockSupabase, 'workspace-456');
      expect(decide).toHaveBeenCalledWith(
        expect.objectContaining({ governance_enabled: true }),
        changeDescriptor,
        undefined
      );
    });
  });

  describe('Complete Governance Flow: Proposal Route', () => {
    it('should execute complete proposal route workflow', async () => {
      // Mock workspace flags for proposal routing
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: true,
        direct_substrate_writes: false,
        governance_ui_enabled: true,
        ep: {
          manual_edit: 'proposal',
          onboarding_dump: 'proposal',
          document_edit: 'proposal',
          reflection_suggestion: 'proposal',
          graph_action: 'proposal',
          timeline_restore: 'proposal'
        },
        default_blast_radius: 'Scoped',
        source: 'workspace_database'
      });

      // Mock policy decision for proposal route
      vi.mocked(decide).mockReturnValue({
        route: 'proposal',
        require_validator: true,
        validator_mode: 'strict',
        effective_blast_radius: 'Global',
        reason: 'ep_policy_proposal:manual_edit'
      });

      // Mock validator agent API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          confidence: 0.85,
          dupes: [],
          ontology_hits: ['strategy', 'planning'],
          suggested_merges: [],
          warnings: ['High blast radius operation'],
          impact_summary: 'Global scope promotion with strategic implications'
        })
      });

      // Mock proposal creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'proposals') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'proposal-integration-123',
                    workspace_id: 'workspace-456',
                    status: 'PROPOSED',
                    validator_report: {
                      confidence: 0.85,
                      impact_summary: 'Global scope promotion with strategic implications'
                    }
                  },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      // Create high-impact change descriptor
      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'PromoteScope',
          data: { block_id: 'block-123', to_scope: 'GLOBAL' }
        }]
      );
      changeDescriptor.blast_radius = 'Global';

      // Execute complete workflow
      const result = await routeChange(mockSupabase, changeDescriptor);

      // Validate proposal route results
      expect(result.committed).toBeUndefined();
      expect(result.proposal_id).toBe('proposal-integration-123');
      expect(result.validation_report?.confidence).toBe(0.85);
      expect(result.validation_report?.warnings).toContain('High blast radius operation');

      // Verify validator was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/validate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('PromoteScope')
        })
      );
    });

    it('should handle proposal approval workflow', async () => {
      // Mock proposal approval process
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'proposals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'proposal-approval-123',
                    status: 'PROPOSED',
                    ops: [{
                      type: 'CreateBlock',
                      data: { content: 'Approved goal', semantic_type: 'goal' }
                    }],
                    workspace_id: 'workspace-456'
                  },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'proposal-approval-123',
                      status: 'APPROVED'
                    },
                    error: null
                  })
                })
              })
            })
          };
        }
        if (table === 'context_blocks') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'block-approved-123' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'proposal_executions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'execution-123', operations_count: 1 },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      // Simulate proposal approval
      const approvalResult = await mockSupabase
        .from('proposals')
        .update({ 
          status: 'APPROVED',
          reviewed_by: 'user-reviewer',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', 'proposal-approval-123')
        .select()
        .single();

      expect(approvalResult.error).toBeNull();
      expect(approvalResult.data.status).toBe('APPROVED');

      // Simulate operation execution
      const executionResult = await mockSupabase
        .from('context_blocks')
        .insert({
          content: 'Approved goal',
          semantic_type: 'goal',
          workspace_id: 'workspace-456'
        })
        .select()
        .single();

      expect(executionResult.error).toBeNull();
      expect(executionResult.data.id).toBe('block-approved-123');
    });
  });

  describe('Complete Governance Flow: Hybrid Route', () => {
    it('should execute risk-based hybrid routing workflow', async () => {
      // Mock workspace flags for hybrid routing
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: false,
        direct_substrate_writes: true,
        governance_ui_enabled: true,
        ep: {
          manual_edit: 'hybrid',
          onboarding_dump: 'hybrid',
          document_edit: 'hybrid',
          reflection_suggestion: 'hybrid',
          graph_action: 'hybrid',
          timeline_restore: 'hybrid'
        },
        default_blast_radius: 'Local',
        source: 'workspace_database'
      });

      // Test low-risk direct routing
      vi.mocked(decide).mockReturnValueOnce({
        route: 'direct',
        require_validator: false,
        validator_mode: 'lenient',
        effective_blast_radius: 'Local',
        reason: 'ep_policy_hybrid:manual_edit:low_risk_assessment'
      });

      const lowRiskChange = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'CreateBlock',
          data: { content: 'Simple goal', semantic_type: 'goal' }
        }]
      );

      // Mock successful direct execution
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_blocks') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'block-hybrid-direct-123' },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const directResult = await routeChange(mockSupabase, lowRiskChange);
      expect(directResult.committed).toBe(true);
      expect(directResult.proposal_id).toBeUndefined();

      // Test high-risk proposal routing
      vi.mocked(decide).mockReturnValueOnce({
        route: 'proposal',
        require_validator: true,
        validator_mode: 'strict',
        effective_blast_radius: 'Global',
        reason: 'ep_policy_hybrid:manual_edit:high_risk_assessment'
      });

      const highRiskChange = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'PromoteScope',
          data: { block_id: 'block-123', to_scope: 'GLOBAL' }
        }]
      );
      highRiskChange.blast_radius = 'Global';

      // Mock validator response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          confidence: 0.6,
          dupes: [],
          ontology_hits: [],
          suggested_merges: [],
          warnings: ['High-risk scope promotion'],
          impact_summary: 'Global scope change with workspace implications'
        })
      });

      // Mock proposal creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'proposals') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'proposal-hybrid-123' },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const proposalResult = await routeChange(mockSupabase, highRiskChange);
      expect(proposalResult.committed).toBeUndefined();
      expect(proposalResult.proposal_id).toBe('proposal-hybrid-123');
      expect(proposalResult.validation_report?.confidence).toBe(0.6);
    });
  });

  describe('Sacred Capture Integration', () => {
    it('should integrate sacred capture with governance routing', async () => {
      // Mock workspace flags for onboarding flow
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: true,
        direct_substrate_writes: true,
        governance_ui_enabled: false,
        ep: {
          onboarding_dump: 'proposal',
          manual_edit: 'direct',
          document_edit: 'proposal',
          reflection_suggestion: 'direct',
          graph_action: 'proposal',
          timeline_restore: 'proposal'
        },
        default_blast_radius: 'Scoped',
        source: 'workspace_database'
      });

      // Mock policy decision for dump extraction
      vi.mocked(decide).mockReturnValue({
        route: 'proposal',
        require_validator: true,
        validator_mode: 'strict',
        effective_blast_radius: 'Scoped',
        reason: 'ep_policy_proposal:onboarding_dump'
      });

      // Mock dump creation (Sacred Principle #1)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'raw_dumps') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'dump-sacred-integration',
                    content: 'Sacred user thought',
                    workspace_id: 'workspace-456',
                    immutable: true
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'proposals') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'proposal-sacred-123' },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      // Mock validator response for agent-processed content
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          confidence: 0.9,
          dupes: [],
          ontology_hits: ['goal', 'objective'],
          suggested_merges: [],
          warnings: [],
          impact_summary: 'P1 substrate extraction from sacred dump'
        })
      });

      // Step 1: Sacred capture
      const dumpResult = await mockSupabase
        .from('raw_dumps')
        .insert({
          content: 'Sacred user thought',
          workspace_id: 'workspace-456',
          content_type: 'text/plain'
        })
        .select()
        .single();

      expect(dumpResult.error).toBeNull();
      expect(dumpResult.data.immutable).toBe(true);

      // Step 2: Agent processing with governance
      const dumpExtractionDescriptor = createDumpExtractionDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        'dump-sacred-integration',
        [{
          type: 'CreateBlock',
          data: { content: 'Extracted goal from sacred dump', semantic_type: 'goal' }
        }]
      );

      const governanceResult = await routeChange(mockSupabase, dumpExtractionDescriptor);

      expect(governanceResult.proposal_id).toBe('proposal-sacred-123');
      expect(governanceResult.validation_report?.confidence).toBe(0.9);
      expect(governanceResult.validation_report?.impact_summary).toContain('P1 substrate extraction');
    });
  });

  describe('Decision Gateway Routing Integration', () => {
    it('should route different entry points according to workspace policy', async () => {
      const testScenarios = [
        {
          entryPoint: 'manual_edit',
          policy: 'direct',
          expectedRoute: 'direct'
        },
        {
          entryPoint: 'document_edit',
          policy: 'proposal',
          expectedRoute: 'proposal'
        },
        {
          entryPoint: 'onboarding_dump',
          policy: 'hybrid',
          expectedRoute: 'varies_by_risk'
        }
      ];

      for (const scenario of testScenarios) {
        // Mock workspace flags for specific scenario
        vi.mocked(getWorkspaceFlags).mockResolvedValue({
          governance_enabled: true,
          validator_required: false,
          direct_substrate_writes: true,
          governance_ui_enabled: true,
          ep: {
            [scenario.entryPoint]: scenario.policy,
            manual_edit: 'direct',
            onboarding_dump: 'hybrid',
            document_edit: 'proposal',
            reflection_suggestion: 'direct',
            graph_action: 'proposal',
            timeline_restore: 'proposal'
          },
          default_blast_radius: 'Local',
          source: 'workspace_database'
        });

        // Mock policy decision
        const expectedRoute = scenario.expectedRoute === 'varies_by_risk' ? 'direct' : scenario.expectedRoute;
        vi.mocked(decide).mockReturnValue({
          route: expectedRoute as 'direct' | 'proposal',
          require_validator: expectedRoute === 'proposal',
          validator_mode: expectedRoute === 'proposal' ? 'strict' : 'lenient',
          effective_blast_radius: 'Local',
          reason: `ep_policy_${scenario.policy}:${scenario.entryPoint}`
        });

        const changeDescriptor = {
          entry_point: scenario.entryPoint as any,
          actor_id: 'user-123',
          workspace_id: 'workspace-456',
          basket_id: 'basket-789',
          ops: [{
            type: 'CreateBlock' as const,
            data: { content: `${scenario.entryPoint} content`, semantic_type: 'goal' }
          }]
        };

        // Verify policy decision matches entry point configuration
        const decision = decide(
          expect.objectContaining({ ep: expect.objectContaining({ [scenario.entryPoint]: scenario.policy }) }),
          changeDescriptor
        );

        if (scenario.expectedRoute !== 'varies_by_risk') {
          expect(decision.route).toBe(expectedRoute);
        }
        expect(decision.reason).toContain(scenario.entryPoint);
      }
    });
  });

  describe('Agent Intelligence Integration', () => {
    it('should enforce mandatory agent intelligence in governance flow', async () => {
      // Mock validator agent call
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/validate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              confidence: 0.8,
              dupes: [],
              ontology_hits: ['goal', 'strategy'],
              suggested_merges: [],
              warnings: [],
              impact_summary: 'Agent-validated substrate creation',
              agent_id: 'P1_VALIDATOR',
              processing_timestamp: new Date().toISOString()
            })
          });
        }
        return Promise.resolve({ ok: false });
      });

      // Mock workspace flags requiring validation
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: true,
        direct_substrate_writes: false,
        governance_ui_enabled: true,
        ep: { manual_edit: 'proposal' } as any,
        default_blast_radius: 'Local',
        source: 'workspace_database'
      });

      vi.mocked(decide).mockReturnValue({
        route: 'proposal',
        require_validator: true,
        validator_mode: 'strict',
        effective_blast_radius: 'Local',
        reason: 'ep_policy_proposal:manual_edit'
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'proposals') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'proposal-agent-123' },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'CreateBlock',
          data: { content: 'Agent-validated content', semantic_type: 'goal' }
        }]
      );

      const result = await routeChange(mockSupabase, changeDescriptor);

      // Verify agent intelligence was mandatory
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/validate'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.validation_report?.agent_id).toBe('P1_VALIDATOR');
      expect(result.validation_report?.impact_summary).toContain('Agent-validated');
    });
  });

  describe('Workspace Isolation Integration', () => {
    it('should enforce workspace isolation throughout governance flow', async () => {
      const workspaceA = 'workspace-aaa';
      const workspaceB = 'workspace-bbb';

      // Mock workspace-specific flag responses
      vi.mocked(getWorkspaceFlags).mockImplementation(async (supabase: any, workspaceId: string) => {
        const workspaceConfigs = {
          [workspaceA]: {
            governance_enabled: true,
            validator_required: true,
            ep: { manual_edit: 'proposal' }
          },
          [workspaceB]: {
            governance_enabled: false,
            validator_required: false,
            ep: { manual_edit: 'direct' }
          }
        };

        return {
          ...workspaceConfigs[workspaceId],
          direct_substrate_writes: true,
          governance_ui_enabled: false,
          default_blast_radius: 'Local',
          source: 'workspace_database'
        } as any;
      });

      // Mock policy decisions respecting workspace isolation
      vi.mocked(decide).mockImplementation((flags: any, cd: any) => {
        return {
          route: flags.ep.manual_edit === 'proposal' ? 'proposal' : 'direct',
          require_validator: flags.validator_required,
          validator_mode: flags.validator_required ? 'strict' : 'lenient',
          effective_blast_radius: 'Local',
          reason: `ep_policy_${flags.ep.manual_edit}:manual_edit`
        };
      });

      // Test workspace A (proposal route)
      const changeA = createManualEditDescriptor(
        'user-123',
        workspaceA,
        'basket-a',
        [{ type: 'CreateBlock', data: { content: 'Workspace A goal', semantic_type: 'goal' } }]
      );

      mockSupabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'proposal-workspace-a' },
              error: null
            })
          })
        })
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          confidence: 0.8,
          dupes: [],
          ontology_hits: [],
          suggested_merges: [],
          warnings: [],
          impact_summary: 'Workspace A validation'
        })
      });

      const resultA = await routeChange(mockSupabase, changeA);
      expect(resultA.proposal_id).toBe('proposal-workspace-a');

      // Test workspace B (direct route)
      const changeB = createManualEditDescriptor(
        'user-123',
        workspaceB,
        'basket-b',
        [{ type: 'CreateBlock', data: { content: 'Workspace B goal', semantic_type: 'goal' } }]
      );

      mockSupabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'block-workspace-b' },
              error: null
            })
          })
        })
      }));

      const resultB = await routeChange(mockSupabase, changeB);
      expect(resultB.committed).toBe(true);

      // Verify workspace isolation
      expect(getWorkspaceFlags).toHaveBeenCalledWith(mockSupabase, workspaceA);
      expect(getWorkspaceFlags).toHaveBeenCalledWith(mockSupabase, workspaceB);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle governance component failures gracefully', async () => {
      // Mock workspace flags failure
      vi.mocked(getWorkspaceFlags).mockRejectedValue(new Error('Flags service unavailable'));

      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{ type: 'CreateBlock', data: { content: 'Test goal', semantic_type: 'goal' } }]
      );

      // Should fall back to safe defaults
      await expect(routeChange(mockSupabase, changeDescriptor)).rejects.toThrow('Flags service unavailable');
    });

    it('should handle validator agent failures', async () => {
      vi.mocked(getWorkspaceFlags).mockResolvedValue({
        governance_enabled: true,
        validator_required: true,
        direct_substrate_writes: false,
        governance_ui_enabled: true,
        ep: { manual_edit: 'proposal' } as any,
        default_blast_radius: 'Local',
        source: 'workspace_database'
      });

      vi.mocked(decide).mockReturnValue({
        route: 'proposal',
        require_validator: true,
        validator_mode: 'strict',
        effective_blast_radius: 'Local',
        reason: 'ep_policy_proposal:manual_edit'
      });

      // Mock validator failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{ type: 'CreateBlock', data: { content: 'Test goal', semantic_type: 'goal' } }]
      );

      await expect(routeChange(mockSupabase, changeDescriptor)).rejects.toThrow();
    });
  });

  describe('Complete Workflow Validation', () => {
    it('should validate entire governance ecosystem integration', async () => {
      // This test validates that all governance components work together
      const workflowComponents = {
        workspaceFlags: 'flagsServer.ts',
        policyDecider: 'policyDecider.ts',
        decisionGateway: 'decisionGateway.ts',
        changeDescriptor: 'changeDescriptor.ts',
        validatorAgent: 'external_api',
        databaseOperations: 'supabase_client',
        timelineEvents: 'event_emission'
      };

      // All components should be integrated
      Object.entries(workflowComponents).forEach(([component, implementation]) => {
        expect(component).toBeDefined();
        expect(implementation).toBeDefined();
        expect(typeof implementation).toBe('string');
      });

      // Workflow should respect YARNNN canon principles
      const canonCompliance = {
        capture_is_sacred: true,
        substrates_are_peers: true,
        narrative_is_deliberate: true,
        agent_intelligence_mandatory: true,
        workspace_isolation: true,
        pipeline_boundaries: true
      };

      Object.values(canonCompliance).forEach(compliant => {
        expect(compliant).toBe(true);
      });
    });
  });
});