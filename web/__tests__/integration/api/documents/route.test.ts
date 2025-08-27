import { POST } from '@/app/api/documents/route';
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

describe('/api/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a document with valid request', async () => {
      const requestBody = {
        basket_id: 'basket-123',
        title: 'New Document',
        metadata: { type: 'draft' },
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock basket validation
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'basket-123', workspace_id: 'workspace-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock document creation RPC
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: 'doc-123',
          error: null,
        })
        // Mock timeline emit RPC
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.document_id).toBe('doc-123');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_create', {
        p_basket_id: 'basket-123',
        p_title: 'New Document',
        p_metadata: { type: 'draft' },
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_timeline_emit', {
        p_basket_id: 'basket-123',
        p_kind: 'document.created',
        p_ref_id: 'doc-123',
        p_preview: 'Created document "New Document"',
        p_payload: { document_id: 'doc-123', title: 'New Document', metadata: { type: 'draft' } },
      });
    });

    it('should use default empty metadata when not provided', async () => {
      const requestBody = {
        basket_id: 'basket-123',
        title: 'New Document',
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'basket-123', workspace_id: 'workspace-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: 'doc-123',
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_create', {
        p_basket_id: 'basket-123',
        p_title: 'New Document',
        p_metadata: {},
      });
    });

    it('should return 422 for invalid request body', async () => {
      const invalidRequestBody = {
        title: 'Missing basket_id',
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid request body');
      expect(data.details).toBeDefined();
    });

    it('should return 422 for empty title', async () => {
      const invalidRequestBody = {
        basket_id: 'basket-123',
        title: '',
        metadata: {},
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 404 for non-existent basket', async () => {
      const requestBody = {
        basket_id: 'non-existent',
        title: 'New Document',
        metadata: {},
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      mockSupabase.from.mockReturnValue({
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

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('basket not found');
    });

    it('should return 404 for basket not in user workspace', async () => {
      const requestBody = {
        basket_id: 'other-workspace-basket',
        title: 'New Document',
        metadata: {},
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'other-workspace-basket', workspace_id: 'different-workspace' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('basket not found');
    });

    it('should handle document creation RPC failure', async () => {
      const requestBody = {
        basket_id: 'basket-123',
        title: 'New Document',
        metadata: {},
      };

      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'basket-123', workspace_id: 'workspace-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC execution failed' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to create document: RPC execution failed');
    });

    it('should handle malformed JSON', async () => {
      const req = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});