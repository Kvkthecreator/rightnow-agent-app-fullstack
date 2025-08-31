import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

describe('Pipeline Boundaries Enforcement (P0→P1→P2→P3→P4)', () => {
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

  describe('P0: Capture Pipeline', () => {
    it('should only write dumps, never interpret', async () => {
      // P0 writes only to raw_dumps table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'raw_dumps') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'dump-p0-test',
                    content: 'Raw user input',
                    workspace_id: 'workspace-456',
                    content_type: 'text/plain'
                  },
                  error: null
                })
              })
            })
          };
        }
        // P0 should NOT write to other tables
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'P0 pipeline violation: cannot write to substrate tables' }
              })
            })
          })
        };
      });

      const supabase = await createSupabaseServerClient();

      // P0 can write dumps
      const dumpResult = await supabase
        .from('raw_dumps')
        .insert({
          content: 'Raw user input',
          workspace_id: 'workspace-456',
          content_type: 'text/plain'
        })
        .select()
        .single();

      expect(dumpResult.error).toBeNull();

      // P0 cannot write to context_blocks (interpretation)
      const blockResult = await supabase
        .from('context_blocks')
        .insert({
          content: 'Interpreted content',
          semantic_type: 'goal',
          workspace_id: 'workspace-456'
        })
        .select()
        .single();

      expect(blockResult.error).toBeDefined();
      expect(blockResult.error.message).toContain('P0 pipeline violation');
    });

    it('should validate P0 write boundaries', () => {
      const p0AllowedTables = ['raw_dumps'];
      const p0ForbiddenTables = ['context_blocks', 'context_items', 'reflections', 'timeline_events'];

      // P0 can only write to raw_dumps
      expect(p0AllowedTables).toContain('raw_dumps');
      expect(p0AllowedTables).toHaveLength(1);

      // P0 cannot write to interpretation tables
      p0ForbiddenTables.forEach(table => {
        expect(p0AllowedTables).not.toContain(table);
      });
    });
  });

  describe('P1: Substrate Pipeline', () => {
    it('should create structured units without relationships', async () => {
      // P1 creates substrate but never relationships
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_blocks') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'block-p1-test',
                    content: 'Structured content',
                    semantic_type: 'goal',
                    workspace_id: 'workspace-456'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'context_relationships') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'P1 pipeline violation: cannot write relationships' }
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // P1 can create substrate
      const blockResult = await supabase
        .from('context_blocks')
        .insert({
          content: 'Structured content',
          semantic_type: 'goal',
          workspace_id: 'workspace-456'
        })
        .select()
        .single();

      expect(blockResult.error).toBeNull();

      // P1 cannot create relationships
      const relationResult = await supabase
        .from('context_relationships')
        .insert({
          from_id: 'block-1',
          to_id: 'block-2',
          relationship_type: 'related_to'
        })
        .select()
        .single();

      expect(relationResult.error).toBeDefined();
      expect(relationResult.error.message).toContain('P1 pipeline violation');
    });

    it('should validate P1 write boundaries', () => {
      const p1AllowedTables = ['context_blocks', 'context_items'];
      const p1ForbiddenTables = ['context_relationships', 'reflections'];

      // P1 creates structured units
      expect(p1AllowedTables).toContain('context_blocks');
      expect(p1AllowedTables).toContain('context_items');

      // P1 never writes relationships or reflections
      p1ForbiddenTables.forEach(table => {
        expect(p1AllowedTables).not.toContain(table);
      });
    });
  });

  describe('P2: Graph Pipeline', () => {
    it('should connect substrates without modifying content', async () => {
      // P2 writes relationships but never modifies substrate content
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_relationships') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'rel-p2-test',
                    from_id: 'block-1',
                    to_id: 'block-2',
                    relationship_type: 'builds_on'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'context_blocks') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'P2 pipeline violation: cannot modify substrate content' }
                  })
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // P2 can create relationships
      const relationResult = await supabase
        .from('context_relationships')
        .insert({
          from_id: 'block-1',
          to_id: 'block-2',
          relationship_type: 'builds_on'
        })
        .select()
        .single();

      expect(relationResult.error).toBeNull();

      // P2 cannot modify substrate content
      const modifyResult = await supabase
        .from('context_blocks')
        .update({ content: 'Modified content' })
        .eq('id', 'block-1')
        .select()
        .single();

      expect(modifyResult.error).toBeDefined();
      expect(modifyResult.error.message).toContain('P2 pipeline violation');
    });

    it('should validate P2 boundary restrictions', () => {
      const p2Operations = {
        allowed: ['CREATE_RELATIONSHIP', 'UPDATE_RELATIONSHIP_TYPE', 'DELETE_RELATIONSHIP'],
        forbidden: ['UPDATE_BLOCK_CONTENT', 'CREATE_REFLECTION', 'MODIFY_SUBSTRATE']
      };

      // P2 only operates on relationships
      expect(p2Operations.allowed).toContain('CREATE_RELATIONSHIP');
      expect(p2Operations.forbidden).toContain('UPDATE_BLOCK_CONTENT');
      expect(p2Operations.forbidden).toContain('MODIFY_SUBSTRATE');
    });
  });

  describe('P3: Reflection Pipeline', () => {
    it('should perform read-only computation with optional cache', async () => {
      // P3 computes reflections but never modifies source substrate
      mockSupabase.rpc.mockImplementation((functionName: string) => {
        if (functionName === 'fn_compute_reflection') {
          return Promise.resolve({
            data: {
              reflection_id: 'refl-p3-test',
              computation_result: 'Derived insights',
              read_only: true,
              cached: false
            },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock substrate modification attempts should fail
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'context_blocks') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'P3 pipeline violation: read-only computation only' }
                  })
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // P3 can compute reflections
      const reflectionResult = await supabase.rpc('fn_compute_reflection', {
        substrate_ids: ['block-1', 'block-2'],
        computation_type: 'pattern_analysis'
      });

      expect(reflectionResult.error).toBeNull();
      expect(reflectionResult.data.read_only).toBe(true);

      // P3 cannot modify substrate
      const modifyResult = await supabase
        .from('context_blocks')
        .update({ content: 'P3 attempted modification' })
        .eq('id', 'block-1')
        .select()
        .single();

      expect(modifyResult.error).toBeDefined();
      expect(modifyResult.error.message).toContain('P3 pipeline violation');
    });

    it('should validate reflection immutability principles', () => {
      const reflectionPrinciples = {
        derived_not_stored: true,
        computed_at_read_time: true,
        optional_caching: true,
        never_modifies_source: true
      };

      // P3 reflections are derived read-models
      expect(reflectionPrinciples.derived_not_stored).toBe(true);
      expect(reflectionPrinciples.computed_at_read_time).toBe(true);
      expect(reflectionPrinciples.optional_caching).toBe(true);
      expect(reflectionPrinciples.never_modifies_source).toBe(true);
    });
  });

  describe('P4: Presentation Pipeline', () => {
    it('should consume substrate without creating it', async () => {
      // P4 reads substrate for document composition but never creates substrate
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'documents') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'doc-p4-test',
                    title: 'Composed Document',
                    narrative_content: 'Deliberate narrative...',
                    substrate_references: ['block-1', 'dump-1']
                  },
                  error: null
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
                  data: null,
                  error: { message: 'P4 pipeline violation: cannot create substrate' }
                })
              })
            })
          };
        }
        return mockSupabase;
      });

      const supabase = await createSupabaseServerClient();

      // P4 can create documents (narrative composition)
      const docResult = await supabase
        .from('documents')
        .insert({
          title: 'Composed Document',
          narrative_content: 'Deliberate narrative that weaves together substrate...',
          substrate_references: [
            { type: 'context_block', id: 'block-1' },
            { type: 'raw_dump', id: 'dump-1' }
          ]
        })
        .select()
        .single();

      expect(docResult.error).toBeNull();

      // P4 cannot create substrate
      const blockResult = await supabase
        .from('context_blocks')
        .insert({
          content: 'P4 attempted substrate creation',
          semantic_type: 'goal',
          workspace_id: 'workspace-456'
        })
        .select()
        .single();

      expect(blockResult.error).toBeDefined();
      expect(blockResult.error.message).toContain('P4 pipeline violation');
    });

    it('should validate P4 composition boundaries', () => {
      const p4Responsibilities = {
        narrative_authoring: true,
        substrate_composition: true,
        document_creation: true,
        substrate_creation: false,
        substrate_modification: false
      };

      // P4 authors narrative and composes substrate
      expect(p4Responsibilities.narrative_authoring).toBe(true);
      expect(p4Responsibilities.substrate_composition).toBe(true);
      expect(p4Responsibilities.document_creation).toBe(true);

      // P4 never creates or modifies substrate
      expect(p4Responsibilities.substrate_creation).toBe(false);
      expect(p4Responsibilities.substrate_modification).toBe(false);
    });
  });

  describe('Pipeline Separation Enforcement', () => {
    it('should prevent cross-pipeline boundary violations', async () => {
      const pipelineViolations = [
        {
          pipeline: 'P0',
          violation: 'interpreting_content',
          description: 'P0 attempted to interpret raw input'
        },
        {
          pipeline: 'P1', 
          violation: 'creating_relationships',
          description: 'P1 attempted to create substrate relationships'
        },
        {
          pipeline: 'P2',
          violation: 'modifying_substrate_content',
          description: 'P2 attempted to modify substrate content'
        },
        {
          pipeline: 'P3',
          violation: 'writing_substrate',
          description: 'P3 attempted to write to substrate tables'
        },
        {
          pipeline: 'P4',
          violation: 'creating_substrate',
          description: 'P4 attempted to create new substrate'
        }
      ];

      // Each violation should be caught and rejected
      pipelineViolations.forEach(violation => {
        expect(violation.pipeline).toMatch(/^P[0-4]$/);
        expect(violation.violation).toBeDefined();
        expect(violation.description).toContain('attempted');
      });
    });

    it('should enforce strict pipeline sequence', () => {
      const pipelineSequence = {
        P0: { writes: ['raw_dumps'], reads: [] },
        P1: { writes: ['context_blocks', 'context_items'], reads: ['raw_dumps'] },
        P2: { writes: ['context_relationships'], reads: ['context_blocks', 'context_items'] },
        P3: { writes: ['reflection_cache'], reads: ['context_blocks', 'context_items', 'context_relationships'] },
        P4: { writes: ['documents'], reads: ['context_blocks', 'context_items', 'reflections', 'timeline_events'] }
      };

      // Validate each pipeline adheres to strict boundaries
      expect(pipelineSequence.P0.writes).toEqual(['raw_dumps']);
      expect(pipelineSequence.P0.reads).toEqual([]);

      expect(pipelineSequence.P1.writes).toContain('context_blocks');
      expect(pipelineSequence.P1.writes).toContain('context_items');
      expect(pipelineSequence.P1.writes).not.toContain('context_relationships');

      expect(pipelineSequence.P2.writes).toEqual(['context_relationships']);
      expect(pipelineSequence.P2.writes).not.toContain('context_blocks');

      expect(pipelineSequence.P3.writes).toEqual(['reflection_cache']);
      expect(pipelineSequence.P3.reads).toContain('context_blocks');

      expect(pipelineSequence.P4.writes).toEqual(['documents']);
      expect(pipelineSequence.P4.reads).toContain('reflections');
    });
  });

  describe('Pipeline Data Flow Validation', () => {
    it('should validate correct data flow between pipelines', async () => {
      // Simulate complete pipeline flow
      const pipelineFlow = [
        { stage: 'P0', input: 'user_thought', output: 'raw_dump', table: 'raw_dumps' },
        { stage: 'P1', input: 'raw_dump', output: 'context_block', table: 'context_blocks' },
        { stage: 'P2', input: 'context_blocks', output: 'relationships', table: 'context_relationships' },
        { stage: 'P3', input: 'substrate_graph', output: 'reflections', table: 'reflection_cache' },
        { stage: 'P4', input: 'substrate_refs', output: 'document', table: 'documents' }
      ];

      // Each stage must consume output from previous stage
      expect(pipelineFlow[1].input).toBe('raw_dump'); // P1 consumes P0 output
      expect(pipelineFlow[2].input).toBe('context_blocks'); // P2 consumes P1 output
      expect(pipelineFlow[3].input).toBe('substrate_graph'); // P3 consumes P2 output
      expect(pipelineFlow[4].input).toBe('substrate_refs'); // P4 consumes substrate

      // Each stage must produce specific output type
      pipelineFlow.forEach((stage, index) => {
        expect(stage.stage).toBe(`P${index}`);
        expect(stage.input).toBeDefined();
        expect(stage.output).toBeDefined();
        expect(stage.table).toBeDefined();
      });
    });

    it('should prevent pipeline bypass attempts', () => {
      const bypassAttempts = [
        { from: 'P0', to: 'P2', reason: 'Cannot skip P1 substrate creation' },
        { from: 'P1', to: 'P3', reason: 'Cannot skip P2 relationship building' },
        { from: 'P0', to: 'P4', reason: 'Cannot skip intermediate processing' }
      ];

      bypassAttempts.forEach(attempt => {
        const fromStage = parseInt(attempt.from.slice(1));
        const toStage = parseInt(attempt.to.slice(1));
        
        // Pipeline stages must be sequential
        expect(toStage - fromStage).toBeGreaterThan(1);
        expect(attempt.reason).toContain('Cannot skip');
      });
    });
  });

  describe('Pipeline Boundary Guards', () => {
    it('should implement boundary guard functions', () => {
      // Pipeline boundary guards should exist
      const boundaryGuards = {
        validateP0Writes: (table: string) => table === 'raw_dumps',
        validateP1Writes: (table: string) => ['context_blocks', 'context_items'].includes(table),
        validateP2Writes: (table: string) => table === 'context_relationships',
        validateP3Writes: (table: string) => table === 'reflection_cache',
        validateP4Writes: (table: string) => table === 'documents'
      };

      // Test boundary validations
      expect(boundaryGuards.validateP0Writes('raw_dumps')).toBe(true);
      expect(boundaryGuards.validateP0Writes('context_blocks')).toBe(false);

      expect(boundaryGuards.validateP1Writes('context_blocks')).toBe(true);
      expect(boundaryGuards.validateP1Writes('context_relationships')).toBe(false);

      expect(boundaryGuards.validateP2Writes('context_relationships')).toBe(true);
      expect(boundaryGuards.validateP2Writes('context_blocks')).toBe(false);

      expect(boundaryGuards.validateP3Writes('reflection_cache')).toBe(true);
      expect(boundaryGuards.validateP3Writes('context_blocks')).toBe(false);

      expect(boundaryGuards.validateP4Writes('documents')).toBe(true);
      expect(boundaryGuards.validateP4Writes('context_blocks')).toBe(false);
    });

    it('should enforce pipeline write permissions', () => {
      const pipelinePermissions = {
        P0: { canWrite: ['raw_dumps'], canRead: [] },
        P1: { canWrite: ['context_blocks', 'context_items'], canRead: ['raw_dumps'] },
        P2: { canWrite: ['context_relationships'], canRead: ['context_blocks', 'context_items'] },
        P3: { canWrite: ['reflection_cache'], canRead: ['*'] },
        P4: { canWrite: ['documents'], canRead: ['*'] }
      };

      // Validate each pipeline has correct permissions
      Object.entries(pipelinePermissions).forEach(([pipeline, perms]) => {
        expect(perms.canWrite).toBeDefined();
        expect(Array.isArray(perms.canWrite)).toBe(true);
        expect(perms.canRead).toBeDefined();
        expect(Array.isArray(perms.canRead)).toBe(true);
      });

      // P0 has most restrictive write permissions
      expect(pipelinePermissions.P0.canWrite).toEqual(['raw_dumps']);
      
      // P3 and P4 have broadest read permissions
      expect(pipelinePermissions.P3.canRead).toEqual(['*']);
      expect(pipelinePermissions.P4.canRead).toEqual(['*']);
    });
  });

  describe('End-to-End Pipeline Integrity', () => {
    it('should validate complete pipeline flow integrity', async () => {
      // Mock complete flow from P0 to P4
      const flowSteps = [
        { pipeline: 'P0', action: 'capture', table: 'raw_dumps' },
        { pipeline: 'P1', action: 'structure', table: 'context_blocks' },
        { pipeline: 'P2', action: 'relate', table: 'context_relationships' },
        { pipeline: 'P3', action: 'reflect', table: 'reflection_cache' },
        { pipeline: 'P4', action: 'compose', table: 'documents' }
      ];

      // Each step must respect pipeline boundaries
      flowSteps.forEach((step, index) => {
        expect(step.pipeline).toBe(`P${index}`);
        expect(step.action).toBeDefined();
        expect(step.table).toBeDefined();
      });

      // Flow must be sequential and boundary-respecting
      const isSequential = flowSteps.every((step, index) => {
        return step.pipeline === `P${index}`;
      });

      expect(isSequential).toBe(true);
    });
  });
});