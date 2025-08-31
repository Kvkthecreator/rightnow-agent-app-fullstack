import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient, basketApi } from '@/lib/api/client';
import { createManualEditDescriptor } from '@/lib/governance/changeDescriptor';

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('ApiClient (Canon-Aligned)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Universal Changes API (ChangeDescriptor-based)', () => {
    it('should submit changes using ChangeDescriptor abstraction', async () => {
      // Mock successful change submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          committed: true,
          execution_summary: {
            operations_executed: 1,
            substrate_ids: ['block-new-123']
          },
          route: 'direct'
        })
      } as Response);

      const changeDescriptor = createManualEditDescriptor(
        'user-123',
        'workspace-456',
        'basket-789',
        [{
          type: 'CreateBlock',
          data: { content: 'Canon-aligned goal', semantic_type: 'goal' }
        }]
      );

      const client = new ApiClient();
      const result = await client.request('/api/changes', {
        method: 'POST',
        body: JSON.stringify(changeDescriptor)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/changes'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(changeDescriptor)
        })
      );

      expect(result.committed).toBe(true);
      expect(result.execution_summary.operations_executed).toBe(1);
    });

    it('should submit proposal-routed changes', async () => {
      // Mock proposal creation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          committed: false,
          proposal_id: 'proposal-abc',
          validation_report: {
            confidence: 0.8,
            dupes: [],
            ontology_hits: ['strategy'],
            warnings: [],
            impact_summary: 'High-impact scope promotion'
          }
        })
      } as Response);

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

      const client = new ApiClient();
      const result = await client.request('/api/changes', {
        method: 'POST',
        body: JSON.stringify(changeDescriptor)
      });

      expect(result.committed).toBe(false);
      expect(result.proposal_id).toBe('proposal-abc');
      expect(result.validation_report.confidence).toBe(0.8);
    });

    it('should handle governance validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ 
          error: 'Invalid ChangeDescriptor',
          validation_errors: ['actor_id required', 'ops array cannot be empty']
        })
      } as Response);

      const invalidChangeDescriptor = {
        entry_point: 'manual_edit',
        workspace_id: 'workspace-456',
        ops: [] // Invalid: empty ops array
      };

      const client = new ApiClient();
      
      await expect(client.request('/api/changes', {
        method: 'POST',
        body: JSON.stringify(invalidChangeDescriptor)
      })).rejects.toThrow('API Error: 400 Bad Request');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new ApiClient();
      
      await expect(client.request('/api/changes', {
        method: 'POST',
        body: JSON.stringify({})
      })).rejects.toThrow('Network error');
    });
  });

  describe('Sacred Capture Path Integration', () => {
    it('should integrate with sacred dump creation endpoint', async () => {
      // Mock sacred capture endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dump_id: 'dump-sacred-123',
          workspace_id: 'workspace-456',
          agent_queue_triggered: true,
          immutable: true
        })
      } as Response);

      const client = new ApiClient();
      const result = await client.request('/api/dumps/new', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Sacred user input',
          workspace_id: 'workspace-456',
          content_type: 'text/plain'
        })
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dumps/new'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.dump_id).toBe('dump-sacred-123');
      expect(result.agent_queue_triggered).toBe(true);
      expect(result.immutable).toBe(true);
    });

    it('should support orchestrated basket+dump ingestion', async () => {
      // Mock onboarding ingestion endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          basket_id: 'basket-onboarding-123',
          dump_ids: ['dump-1', 'dump-2'],
          agent_processing_triggered: true,
          substrate_generation_queued: true
        })
      } as Response);

      const client = new ApiClient();
      const result = await client.request('/api/baskets/ingest', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: 'workspace-456',
          template_id: 'template-basic',
          initial_dumps: [
            { content: 'First dump', content_type: 'text/plain' },
            { content: 'Second dump', content_type: 'text/plain' }
          ]
        })
      });

      expect(result.agent_processing_triggered).toBe(true);
      expect(result.substrate_generation_queued).toBe(true);
      expect(result.dump_ids).toHaveLength(2);
    });
  });

  describe('ApiClient Core Functionality', () => {
    it('can be instantiated with custom base URL', () => {
      const client = new ApiClient('https://custom.api.com');
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('adds correct headers to requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      const client = new ApiClient();
      await client.request('/test', { method: 'POST' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle workspace-scoped API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ 
          error: 'Workspace access denied',
          workspace_id: 'workspace-456',
          user_id: 'user-123'
        })
      } as Response);

      const client = new ApiClient();
      
      await expect(client.request('/api/test-workspace-endpoint')).rejects.toThrow('API Error: 403 Forbidden');
    });
  });
});