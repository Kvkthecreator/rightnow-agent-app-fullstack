import { PATCH } from '@/app/api/documents/[id]/route';
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

describe('/api/documents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH', () => {
    it('should update document title', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        title: 'Updated Title',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      // Mock document validation
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: documentId,
                basket_id: 'basket-123',
                title: 'Old Title',
                workspace_id: 'workspace-123',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock update RPC
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Mock timeline emit RPC
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await PATCH(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_update', {
        p_document_id: documentId,
        p_title: 'Updated Title',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_timeline_emit', {
        p_basket_id: 'basket-123',
        p_kind: 'document.updated',
        p_ref_id: documentId,
        p_preview: 'Updated document "Updated Title"',
        p_payload: { document_id: documentId, title: 'Updated Title', metadata: undefined },
      });
    });

    it('should update document metadata only', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        metadata: { status: 'published', version: 2 },
      };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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
                title: 'Same Title',
                workspace_id: 'workspace-123',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await PATCH(req, { params });

      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_update', {
        p_document_id: documentId,
        p_metadata: { status: 'published', version: 2 },
      });
      
      // Timeline event should not be emitted for metadata-only changes
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('should update both title and metadata', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        title: 'New Title',
        metadata: { status: 'draft' },
      };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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
                title: 'Old Title',
                workspace_id: 'workspace-123',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const response = await PATCH(req, { params });

      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_update', {
        p_document_id: documentId,
        p_title: 'New Title',
        p_metadata: { status: 'draft' },
      });
    });

    it('should return 422 for invalid request body', async () => {
      const documentId = 'doc-123';
      const invalidRequestBody = {};

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const params = Promise.resolve({ id: documentId });

      const response = await PATCH(req, { params });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 404 for non-existent document', async () => {
      const documentId = 'non-existent';
      const requestBody = { title: 'New Title' };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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

      const response = await PATCH(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('document not found');
    });

    it('should return 403 for document not in user workspace', async () => {
      const documentId = 'doc-123';
      const requestBody = { title: 'New Title' };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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
                title: 'Document',
                workspace_id: 'different-workspace',
              },
              error: null,
            }),
          }),
        }),
      });

      const response = await PATCH(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('unauthorized');
    });

    it('should not emit timeline event when title unchanged', async () => {
      const documentId = 'doc-123';
      const requestBody = {
        title: 'Same Title',
      };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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
                title: 'Same Title',
                workspace_id: 'workspace-123',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await PATCH(req, { params });

      expect(response.status).toBe(200);
      // Only update RPC called, no timeline emit
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_document_update', {
        p_document_id: documentId,
        p_title: 'Same Title',
      });
    });

    it('should handle update RPC failure', async () => {
      const documentId = 'doc-123';
      const requestBody = { title: 'New Title' };

      const req = new Request(`http://localhost/api/documents/${documentId}`, {
        method: 'PATCH',
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
                title: 'Old Title',
                workspace_id: 'workspace-123',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const response = await PATCH(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to update document: Update failed');
    });
  });
});