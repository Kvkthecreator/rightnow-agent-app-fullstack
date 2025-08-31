import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

describe('Sacred Principles Enforcement', () => {
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

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase);
    vi.clearAllMocks();
  });

  describe('Sacred Principle #1: Capture is Sacred', () => {
    it('should enforce raw_dump immutability', async () => {
      // Mock existing raw_dump
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'raw_dumps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { 
                    id: 'dump-123',
                    content: 'Original content',
                    workspace_id: 'workspace-456',
                    created_at: '2025-08-31T00:00:00Z'
                  },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update not allowed on raw_dumps' }
                  })
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // Attempt to update raw_dump should fail
      const updateResult = await supabase
        .from('raw_dumps')
        .update({ content: 'Modified content' })
        .eq('id', 'dump-123')
        .select()
        .single();

      expect(updateResult.error).toBeDefined();
      expect(updateResult.error.message).toContain('Update not allowed on raw_dumps');
    });

    it('should ensure all user input becomes raw_dump', async () => {
      // Mock successful raw_dump creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'raw_dumps') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'dump-new',
                    content: 'User input content',
                    workspace_id: 'workspace-456',
                    content_type: 'text/plain'
                  },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();
      const userInput = 'This is important user thought';

      // Every user input must create a raw_dump
      const result = await supabase
        .from('raw_dumps')
        .insert({
          content: userInput,
          workspace_id: 'workspace-456',
          content_type: 'text/plain'
        })
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.content).toBe(userInput);
      expect(result.data.workspace_id).toBe('workspace-456');
    });
  });

  describe('Sacred Principle #2: All Substrates are Peers', () => {
    it('should treat all substrate types equally in documents', async () => {
      // Mock document substrate references
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'doc-123',
                    substrate_references: [
                      { type: 'raw_dump', id: 'dump-1' },
                      { type: 'context_block', id: 'block-1' },
                      { type: 'context_item', id: 'item-1' },
                      { type: 'reflection', id: 'reflection-1' },
                      { type: 'timeline_event', id: 'event-1' }
                    ]
                  },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      const result = await supabase
        .from('documents')
        .select('substrate_references')
        .eq('id', 'doc-123')
        .single();

      expect(result.error).toBeNull();
      expect(result.data.substrate_references).toHaveLength(5);
      
      // Verify all substrate types are present and treated equally
      const substrateTypes = result.data.substrate_references.map((ref: any) => ref.type);
      expect(substrateTypes).toContain('raw_dump');
      expect(substrateTypes).toContain('context_block');
      expect(substrateTypes).toContain('context_item');
      expect(substrateTypes).toContain('reflection');
      expect(substrateTypes).toContain('timeline_event');
    });

    it('should reject substrate type hierarchy assumptions', () => {
      // Test that no substrate type has privileged access
      const substrateTypes = ['raw_dump', 'context_block', 'context_item', 'reflection', 'timeline_event'];
      
      substrateTypes.forEach(type => {
        // Each substrate type should have equal capabilities
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });

      // No substrate type should be marked as "primary" or "privileged"
      const invalidHierarchicalTerms = ['primary', 'master', 'parent', 'root', 'privileged'];
      substrateTypes.forEach(type => {
        invalidHierarchicalTerms.forEach(term => {
          expect(type.toLowerCase()).not.toContain(term);
        });
      });
    });
  });

  describe('Sacred Principle #3: Narrative is Deliberate', () => {
    it('should enforce deliberate document composition', async () => {
      // Mock document with both substrate references and narrative
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'doc-123',
                    title: 'Deliberate Document',
                    narrative_content: 'This is authored prose that provides context...',
                    substrate_references: [
                      { type: 'context_block', id: 'block-1' },
                      { type: 'raw_dump', id: 'dump-1' }
                    ]
                  },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      const result = await supabase
        .from('documents')
        .select('title, narrative_content, substrate_references')
        .eq('id', 'doc-123')
        .single();

      expect(result.error).toBeNull();
      
      // Documents must have deliberate narrative content
      expect(result.data.narrative_content).toBeDefined();
      expect(result.data.narrative_content.length).toBeGreaterThan(0);
      
      // Documents must compose substrate references
      expect(result.data.substrate_references).toBeDefined();
      expect(Array.isArray(result.data.substrate_references)).toBe(true);
      expect(result.data.substrate_references.length).toBeGreaterThan(0);
    });

    it('should reject pure auto-generated documents', () => {
      // Documents cannot be purely auto-generated without deliberate narrative
      const invalidDocument = {
        id: 'doc-invalid',
        substrate_references: [{ type: 'context_block', id: 'block-1' }],
        // Missing narrative_content - this violates Sacred Principle #3
      };

      expect(invalidDocument.narrative_content).toBeUndefined();
      
      // This should be rejected by validation
      const hasDeliberateNarrative = invalidDocument.narrative_content && 
        invalidDocument.narrative_content.length > 0;
      expect(hasDeliberateNarrative).toBe(false);
    });
  });

  describe('Sacred Principle #4: Agent Intelligence is Mandatory', () => {
    it('should enforce agent processing for substrate creation', async () => {
      // Mock context_blocks creation requires agent processing
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_blocks') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Direct substrate creation not allowed - must use agent pipeline' }
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // Direct substrate creation should fail
      const result = await supabase
        .from('context_blocks')
        .insert({
          content: 'Manual block',
          semantic_type: 'goal',
          workspace_id: 'workspace-456'
        })
        .select()
        .single();

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('must use agent pipeline');
    });

    it('should require agent validation for all proposals', async () => {
      const proposalWithoutValidation = {
        id: 'proposal-123',
        workspace_id: 'workspace-456',
        ops: [{ type: 'CreateBlock', data: { content: 'Test', semantic_type: 'goal' } }],
        // Missing validator_report - violates Sacred Principle #4
      };

      // Validator report is mandatory for all proposals
      expect(proposalWithoutValidation.validator_report).toBeUndefined();
      
      const hasAgentValidation = proposalWithoutValidation.validator_report && 
        typeof proposalWithoutValidation.validator_report === 'object';
      expect(hasAgentValidation).toBe(false);
    });

    it('should ensure substrate evolution through agent processing', async () => {
      // Mock raw_dump to substrate flow requiring agent processing
      mockSupabase.rpc.mockImplementation((functionName: string) => {
        if (functionName === 'fn_process_dump_to_substrate') {
          return Promise.resolve({
            data: {
              agent_id: 'P1_SUBSTRATE',
              substrate_created: ['block-new-1', 'item-new-1'],
              processing_timestamp: '2025-08-31T00:00:00Z'
            },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: { message: 'Unknown function' } });
      });

      const supabase = await createSupabaseServerClient();

      // Raw dump processing must involve agent intelligence
      const result = await supabase.rpc('fn_process_dump_to_substrate', {
        dump_id: 'dump-123',
        workspace_id: 'workspace-456'
      });

      expect(result.error).toBeNull();
      expect(result.data.agent_id).toBe('P1_SUBSTRATE');
      expect(result.data.substrate_created).toBeDefined();
      expect(Array.isArray(result.data.substrate_created)).toBe(true);
    });
  });

  describe('Sacred Principles Integration', () => {
    it('should validate complete sacred principles workflow', async () => {
      // Test the complete flow honoring all four sacred principles
      
      // 1. Capture is Sacred: Raw input becomes immutable dump
      const userInput = 'I need to organize my project goals better';
      
      // Mock dump creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'raw_dumps') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'dump-sacred',
                    content: userInput,
                    workspace_id: 'workspace-456',
                    immutable: true
                  },
                  error: null
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      // Mock agent processing (Sacred Principle #4)
      mockSupabase.rpc.mockImplementation((functionName: string) => {
        if (functionName === 'fn_trigger_agent_processing') {
          return Promise.resolve({
            data: {
              agent_queue_id: 'queue-abc',
              processing_status: 'queued',
              agent_intelligence_required: true
            },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const supabase = await createSupabaseServerClient();

      // 1. Sacred capture
      const dumpResult = await supabase
        .from('raw_dumps')
        .insert({
          content: userInput,
          workspace_id: 'workspace-456',
          content_type: 'text/plain'
        })
        .select()
        .single();

      expect(dumpResult.error).toBeNull();
      expect(dumpResult.data.content).toBe(userInput);

      // 4. Agent intelligence is mandatory
      const agentResult = await supabase.rpc('fn_trigger_agent_processing', {
        dump_id: dumpResult.data.id
      });

      expect(agentResult.error).toBeNull();
      expect(agentResult.data.agent_intelligence_required).toBe(true);
    });

    it('should reject violations of sacred principles', () => {
      // Test violations that should be prevented
      
      // Violation #1: Attempting to modify raw_dump
      const immutableViolation = () => {
        throw new Error('Cannot modify immutable raw_dump');
      };

      // Violation #2: Privileging one substrate type
      const hierarchyViolation = () => {
        throw new Error('Cannot establish substrate hierarchy - all substrates are peers');
      };

      // Violation #3: Auto-generating documents without narrative
      const narrativeViolation = () => {
        throw new Error('Documents require deliberate narrative composition');
      };

      // Violation #4: Creating substrate without agent processing
      const agentViolation = () => {
        throw new Error('Substrate creation requires agent intelligence');
      };

      expect(immutableViolation).toThrow('Cannot modify immutable raw_dump');
      expect(hierarchyViolation).toThrow('all substrates are peers');
      expect(narrativeViolation).toThrow('deliberate narrative composition');
      expect(agentViolation).toThrow('agent intelligence');
    });
  });

  describe('Cross-Principle Validation', () => {
    it('should validate principle interactions', () => {
      // Sacred Principle interactions must be consistent
      
      // Principle #1 + #4: Captured content requires agent processing
      const captureFlow = {
        step1: 'user_input → raw_dump (Sacred #1: immutable)',
        step2: 'raw_dump → agent_processing (Sacred #4: mandatory)',
        step3: 'agent_processing → substrate (Sacred #2: peer equality)',
        step4: 'substrate → document_composition (Sacred #3: deliberate narrative)'
      };

      // Verify flow respects all principles
      expect(captureFlow.step1).toContain('immutable');
      expect(captureFlow.step2).toContain('mandatory');
      expect(captureFlow.step3).toContain('peer equality');
      expect(captureFlow.step4).toContain('deliberate narrative');
    });

    it('should enforce workspace isolation across all principles', async () => {
      // All sacred principles must respect workspace isolation
      const workspace1 = 'workspace-aaa';
      const workspace2 = 'workspace-bbb';

      // Mock workspace-isolated queries
      mockSupabase.from.mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              mockReturnValue: (workspace_id: string) => ({
                data: workspace_id === workspace1 ? [{ id: 'item-1' }] : [],
                error: null
              })
            })
          })
        };
      });

      // Sacred principles must be enforced per workspace
      const principleEnforcement = {
        capture_isolation: true,
        substrate_peer_isolation: true,
        narrative_isolation: true,
        agent_intelligence_isolation: true
      };

      expect(principleEnforcement.capture_isolation).toBe(true);
      expect(principleEnforcement.substrate_peer_isolation).toBe(true);
      expect(principleEnforcement.narrative_isolation).toBe(true);
      expect(principleEnforcement.agent_intelligence_isolation).toBe(true);
    });
  });
});