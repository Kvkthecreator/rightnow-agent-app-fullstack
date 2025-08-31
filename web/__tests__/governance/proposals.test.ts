import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/baskets/[id]/proposals/route';
import { POST as approveProposal } from '@/app/api/baskets/[id]/proposals/[proposalId]/approve/route';
import { POST as rejectProposal } from '@/app/api/baskets/[id]/proposals/[proposalId]/reject/route';

// Mock workspace governance flags
vi.mock('@/lib/governance/flagsServer', () => ({
  getWorkspaceFlags: vi.fn().mockResolvedValue({
    governance_enabled: true,
    validator_required: false,
    direct_substrate_writes: false,
    governance_ui_enabled: true,
    ep: {
      onboarding_dump: 'proposal',
      manual_edit: 'proposal',
      document_edit: 'proposal',
      reflection_suggestion: 'proposal',
      graph_action: 'proposal',
      timeline_restore: 'proposal'
    },
    default_blast_radius: 'Scoped',
    source: 'workspace_database'
  }),
  shouldUseGovernance: vi.fn().mockResolvedValue(true),
  isValidatorRequired: vi.fn().mockResolvedValue(false),
  allowDirectSubstrateWrites: vi.fn().mockResolvedValue(false),
  isGovernanceUIEnabled: vi.fn().mockResolvedValue(true)
}));

// Mock workspace auth
vi.mock('@/lib/workspaces/ensureWorkspaceServer', () => ({
  ensureWorkspaceServer: vi.fn().mockResolvedValue({
    user: { id: 'user-123' },
    workspace: { id: 'workspace-123' }
  })
}));

// Mock supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockReturnThis()
};

vi.mock('@/lib/supabase/clients', () => ({
  createRouteHandlerClient: () => mockSupabase
}));

describe('Governance Proposals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/baskets/[id]/proposals', () => {
    it('should return proposals for a basket', async () => {
      const mockProposals = [
        {
          id: 'proposal-1',
          proposal_kind: 'Extraction',
          origin: 'agent',
          status: 'PROPOSED',
          ops: [{ type: 'CreateBlock', data: { content: 'Test block' } }],
          validator_report: { confidence: 0.8, impact_summary: 'Low impact' },
          created_at: '2025-08-30T12:00:00Z',
          provenance: ['dump-1']
        }
      ];

      mockSupabase.select.mockResolvedValue({ data: mockProposals, error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals');
      const response = await GET(req, { params: Promise.resolve({ id: 'basket-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].proposal_kind).toBe('Extraction');
      expect(data.items[0].ops_summary).toContain('CreateBlock');
    });

    it('should filter proposals by status', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals?status=APPROVED');
      await GET(req, { params: Promise.resolve({ id: 'basket-123' }) });

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'APPROVED');
    });

    it('should return 503 when governance disabled', async () => {
      vi.mocked(vi.importMock('@/lib/governance/featureFlags')).shouldUseGovernance.mockReturnValue(false);

      const req = new Request('http://localhost/api/baskets/basket-123/proposals');
      const response = await GET(req, { params: Promise.resolve({ id: 'basket-123' }) });

      expect(response.status).toBe(503);
      expect((await response.json()).governance_status).toBe('disabled');
    });
  });

  describe('POST /api/baskets/[id]/proposals', () => {
    it('should create a proposal with agent validation bypassed', async () => {
      const mockBasket = { workspace_id: 'workspace-123' };
      const mockProposal = {
        id: 'proposal-123',
        status: 'PROPOSED'
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockBasket, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockProposal, error: null });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals', {
        method: 'POST',
        body: JSON.stringify({
          proposal_kind: 'Edit',
          ops: [{ type: 'CreateBlock', data: { content: 'Test content' } }],
          origin: 'human'
        })
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'basket-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposal_id).toBe('proposal-123');
      expect(data.status).toBe('PROPOSED');
    });

    it('should reject invalid operations', async () => {
      const req = new Request('http://localhost/api/baskets/basket-123/proposals', {
        method: 'POST',
        body: JSON.stringify({
          proposal_kind: 'Invalid',
          ops: [],
          origin: 'human'
        })
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'basket-123' }) });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/baskets/[id]/proposals/[proposalId]/approve', () => {
    it('should execute proposal operations atomically', async () => {
      const mockProposal = {
        id: 'proposal-123',
        status: 'PROPOSED',
        is_executed: false,
        ops: [
          { type: 'CreateBlock', content: 'Test block', semantic_type: 'note' }
        ]
      };

      const mockExecutionResult = {
        id: 'block-123'
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockProposal, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockExecutionResult, error: null });
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals/proposal-123/approve', {
        method: 'POST'
      });

      const response = await approveProposal(req, { 
        params: Promise.resolve({ id: 'basket-123', proposalId: 'proposal-123' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.commit_id).toBeDefined();
      expect(data.operations_executed).toBe(1);
    });

    it('should reject already executed proposals', async () => {
      const mockProposal = {
        id: 'proposal-123',
        status: 'APPROVED',
        is_executed: true,
        ops: []
      };

      mockSupabase.single.mockResolvedValue({ data: mockProposal, error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals/proposal-123/approve', {
        method: 'POST'
      });

      const response = await approveProposal(req, { 
        params: Promise.resolve({ id: 'basket-123', proposalId: 'proposal-123' }) 
      });

      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('already executed');
    });
  });

  describe('POST /api/baskets/[id]/proposals/[proposalId]/reject', () => {
    it('should reject a proposal with reason', async () => {
      const mockProposal = {
        id: 'proposal-123',
        status: 'PROPOSED',
        proposal_kind: 'Edit'
      };

      mockSupabase.single.mockResolvedValue({ data: mockProposal, error: null });
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals/proposal-123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Duplicate content' })
      });

      const response = await rejectProposal(req, { 
        params: Promise.resolve({ id: 'basket-123', proposalId: 'proposal-123' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('REJECTED');
    });

    it('should prevent rejecting executed proposals', async () => {
      const mockProposal = {
        id: 'proposal-123',
        status: 'APPROVED',
        is_executed: true
      };

      mockSupabase.single.mockResolvedValue({ data: mockProposal, error: null });

      const req = new Request('http://localhost/api/baskets/basket-123/proposals/proposal-123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Changed mind' })
      });

      const response = await rejectProposal(req, { 
        params: Promise.resolve({ id: 'basket-123', proposalId: 'proposal-123' }) 
      });

      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('Cannot reject executed proposal');
    });
  });
});