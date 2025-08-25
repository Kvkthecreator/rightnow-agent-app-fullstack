import { GET, POST } from '@/app/api/baskets/[id]/reflections/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ReflectionEngine } from '@/lib/server/ReflectionEngine';

jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers');
jest.mock('@/lib/auth/getAuthenticatedUser');
jest.mock('@/lib/server/ReflectionEngine');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

const mockEngine = {
  getReflections: jest.fn(),
};

(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
(getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-123' });
(ReflectionEngine as jest.Mock).mockImplementation(() => mockEngine);

describe('/api/baskets/[id]/reflections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return reflections for authorized user', async () => {
      const basket_id = 'basket-123';
      const req = new Request('http://localhost/api/baskets/basket-123/reflections');
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: basket_id, workspace_id: 'workspace-123' },
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
                  data: { id: 'membership-123' },
                  error: null,
                }),
              }),
            }),
          }),
        });

      const mockReflections = {
        reflections: [
          {
            id: 'reflection-1',
            basket_id,
            reflection_text: 'Test reflection',
            substrate_window_start: '2025-01-01T00:00:00Z',
            substrate_window_end: '2025-01-02T00:00:00Z',
            computation_timestamp: '2025-01-02T00:00:00Z',
            meta: {},
          },
        ],
        has_more: false,
        next_cursor: undefined,
      };

      mockEngine.getReflections.mockResolvedValue(mockReflections);

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reflections).toHaveLength(1);
      expect(mockEngine.getReflections).toHaveBeenCalledWith(basket_id, 'workspace-123', undefined, 10, false);
    });

    it('should return 404 for non-existent basket', async () => {
      const basket_id = 'non-existent';
      const req = new Request('http://localhost/api/baskets/non-existent/reflections');
      const params = Promise.resolve({ id: basket_id });

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

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Basket not found');
    });

    it('should return 403 for unauthorized user', async () => {
      const basket_id = 'basket-123';
      const req = new Request('http://localhost/api/baskets/basket-123/reflections');
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: basket_id, workspace_id: 'workspace-123' },
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

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

    it('should handle refresh parameter', async () => {
      const basket_id = 'basket-123';
      const req = new Request('http://localhost/api/baskets/basket-123/reflections?refresh=1');
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: basket_id, workspace_id: 'workspace-123' },
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
                  data: { id: 'membership-123' },
                  error: null,
                }),
              }),
            }),
          }),
        });

      const mockReflections = {
        reflections: [{
          id: 'reflection-1',
          basket_id,
          reflection_text: 'Fresh reflection',
          substrate_window_start: '2025-01-01T00:00:00Z',
          substrate_window_end: '2025-01-02T00:00:00Z',
          computation_timestamp: '2025-01-02T00:00:00Z',
          meta: {},
        }],
        has_more: false,
      };

      mockEngine.getReflections.mockResolvedValue(mockReflections);

      const response = await GET(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockEngine.getReflections).toHaveBeenCalledWith(basket_id, 'workspace-123', undefined, 10, true);
    });

    it('should handle X-Force-Recompute header', async () => {
      const basket_id = 'basket-123';
      const req = new Request('http://localhost/api/baskets/basket-123/reflections', {
        headers: { 'X-Force-Recompute': '1' },
      });
      const params = Promise.resolve({ id: basket_id });

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: basket_id, workspace_id: 'workspace-123' },
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
                  data: { id: 'membership-123' },
                  error: null,
                }),
              }),
            }),
          }),
        });

      mockEngine.getReflections.mockResolvedValue({ reflections: [], has_more: false });

      await GET(req, { params });

      expect(mockEngine.getReflections).toHaveBeenCalledWith(basket_id, 'workspace-123', undefined, 10, true);
    });
  });

  describe('POST', () => {
    it('should return 405 Method Not Allowed', async () => {
      const basket_id = 'basket-123';
      const req = new Request('http://localhost/api/baskets/basket-123/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const params = Promise.resolve({ id: basket_id });

      const response = await POST(req, { params });

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
    });
  });
});