import { POST } from '@/app/api/documents/[id]/blocks/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/getAuthenticatedUser');
jest.mock('@/lib/workspaces/ensureWorkspaceForUser');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  rpc: jest.fn(),
};

(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
(getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-123' });
(ensureWorkspaceForUser as jest.Mock).mockResolvedValue({ id: 'workspace-123' });

describe('/api/documents/[id]/blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should attach block to document with all fields', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        block_id: 'block-456',
        occurrences: 3,
        snippets: ['snippet 1', 'snippet 2'],
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      // Mock document validation
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: documentId,
                  basket_id: 'basket-123',
                  workspace_id: 'workspace-123',
                },
                error: null,
              }),
            }),
          }),
        })
        // Mock block validation
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'block-456',
                    basket_id: 'basket-123',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        });

      // Mock attach block RPC
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: 'block-link-789',
          error: null,
        })
        // Mock timeline emit RPC
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('block-link-789');
      expect(data.document_id).toBe(documentId);
      expect(data.block_id).toBe('block-456');
      expect(data.occurrences).toBe(3);
      expect(data.snippets).toEqual(['snippet 1', 'snippet 2']);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_attach_block', {
        p_document_id: documentId,
        p_block_id: 'block-456',
        p_occurrences: 3,
        p_snippets: ['snippet 1', 'snippet 2'],
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_timeline_emit', {
        p_basket_id: 'basket-123',
        p_kind: 'block.linked',
        p_ref_id: 'block-link-789',
        p_preview: 'Linked block to document',
        p_payload: {
          document_id: documentId,
          block_id: 'block-456',
          block_link_id: 'block-link-789',
          occurrences: 3,
        },
      });
    });

    it('should attach block with default values', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        block_id: 'block-456',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: documentId,
                  basket_id: 'basket-123',
                  workspace_id: 'workspace-123',
                },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'block-456',
                    basket_id: 'basket-123',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        });

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: 'block-link-789',
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.occurrences).toBe(1);
      expect(data.snippets).toEqual([]);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_attach_block', {
        p_document_id: documentId,
        p_block_id: 'block-456',
        p_occurrences: 1,
        p_snippets: [],
      });
    });

    it('should return 422 for invalid request body', async () => {
      const documentId = 'doc-123';
      const invalidRequestBody = {};

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid request body');
      expect(data.details).toBeDefined();
    });

    it('should return 404 for non-existent document', async () => {
      const documentId = 'non-existent';
      const requestBody = {
        block_id: 'block-456',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('document not found');
    });

    it('should return 403 for document not in user workspace', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        block_id: 'block-456',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: documentId,
                basket_id: 'basket-123',
                workspace_id: 'different-workspace',
              },
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('unauthorized');
    });

    it('should return 404 for block not found or not in same basket', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        block_id: 'block-456',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: documentId,
                  basket_id: 'basket-123',
                  workspace_id: 'workspace-123',
                },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('block not found or does not belong to basket');
    });

    it('should handle attach block RPC failure', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        block_id: 'block-456',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: documentId,
                  basket_id: 'basket-123',
                  workspace_id: 'workspace-123',
                },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'block-456',
                    basket_id: 'basket-123',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Attach failed' },
      });

      const response = await POST(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to attach block: Attach failed');
    });
  });
});