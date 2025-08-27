import { GET } from '@/app/api/baskets/[id]/documents/route';
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
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
(getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-123' });
(ensureWorkspaceForUser as jest.Mock).mockResolvedValue({ id: 'workspace-123' });

describe('/api/baskets/[id]/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return documents for a valid basket', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

      // Mock basket validation
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: basket_id, workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Mock documents query
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'doc-1',
                    basket_id,
                    title: 'Document 1',
                    created_at: '2025-01-01T12:00:00Z',
                    updated_at: '2025-01-01T13:00:00Z',
                    metadata: { type: 'draft' },
                  },
                  {
                    id: 'doc-2',
                    basket_id,
                    title: 'Document 2',
                    created_at: '2025-01-01T11:00:00Z',
                    updated_at: '2025-01-01T12:30:00Z',
                    metadata: {},
                  },
                ],
                error: null,
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(2);
      expect(data.documents[0].id).toBe('doc-1');
      expect(data.documents[0].title).toBe('Document 1');
      expect(data.documents[0].metadata).toEqual({ type: 'draft' });
      expect(data.documents[1].metadata).toEqual({});
      expect(data.last_cursor).toBe('2025-01-01T12:30:00Z');
    });

    it('should return empty list for basket with no documents', async () => {
      const basket_id = 'basket-empty';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: basket_id, workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(0);
      expect(data.last_cursor).toBeUndefined();
    });

    it('should return 404 for non-existent basket', async () => {
      const basket_id = 'non-existent';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

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

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('basket not found');
    });

    it('should return 404 for basket not in user workspace', async () => {
      const basket_id = 'other-workspace-basket';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: basket_id, workspace_id: 'different-workspace' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('basket not found');
    });

    it('should handle database errors gracefully', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('basket not found');
    });

    it('should validate response schema', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/documents`);
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: basket_id, workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'doc-1',
                    basket_id,
                    title: 'Valid Document',
                    created_at: '2025-01-01T12:00:00Z',
                    updated_at: '2025-01-01T13:00:00Z',
                    metadata: { key: 'value' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('documents');
      expect(data).toHaveProperty('last_cursor');
      expect(Array.isArray(data.documents)).toBe(true);
      
      // Validate document structure
      const doc = data.documents[0];
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('basket_id');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('created_at');
      expect(doc).toHaveProperty('updated_at');
      expect(doc).toHaveProperty('metadata');
      expect(typeof doc.metadata).toBe('object');
    });
  });
});