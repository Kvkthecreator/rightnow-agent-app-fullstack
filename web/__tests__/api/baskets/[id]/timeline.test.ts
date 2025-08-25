import { GET } from '@/app/api/baskets/[id]/timeline/route';
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
  or: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
(getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-123' });
(ensureWorkspaceForUser as jest.Mock).mockResolvedValue({ id: 'workspace-123' });

describe('/api/baskets/[id]/timeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return timeline events for a basket', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/timeline`);
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
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'event-1',
                        basket_id,
                        kind: 'dump.created',
                        payload: { dump_id: 'dump-1', char_count: 100 },
                        ts: '2025-01-01T12:00:00Z',
                        actor_id: 'user-123',
                        agent_type: null,
                        origin: 'user',
                      },
                      {
                        id: 'event-2',
                        basket_id,
                        kind: 'reflection.computed',
                        payload: { reflection_id: 'reflection-1' },
                        ts: '2025-01-01T13:00:00Z',
                        actor_id: null,
                        agent_type: null,
                        origin: 'system',
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events).toHaveLength(2);
      expect(data.has_more).toBe(false);
      expect(data.events[0].event_type).toBe('dump.created');
      expect(data.events[1].event_type).toBe('reflection.computed');
      expect(data.next_cursor).toBeUndefined();
      expect(data.last_cursor).toBe('2025-01-01T13:00:00Z:event-2');
    });

    it('should handle cursor-based pagination', async () => {
      const basket_id = 'basket-123';
      const cursor = '2025-01-01T12:00:00Z:event-1';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/timeline?cursor=${cursor}`);
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
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    or: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from().select().eq().order().order().limit().or).toHaveBeenCalled();
    });

    it('should filter by event types', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/timeline?event_type=dump.created&event_type=reflection.computed`);
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
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const response = await GET(req as any, { params });

      expect(response.status).toBe(200);
      expect(mockSupabase.from().select().eq().order().order().limit().in).toHaveBeenCalledWith(
        'kind',
        ['dump.created', 'reflection.computed']
      );
    });

    it('should return 404 for non-existent basket', async () => {
      const basket_id = 'non-existent';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/timeline`);
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
      expect(data.error).toBe('not_found');
    });

    it('should validate query parameters', async () => {
      const basket_id = 'basket-123';
      const req = new Request(`http://localhost/api/baskets/${basket_id}/timeline?limit=invalid`);
      const params = Promise.resolve({ id: basket_id });

      const response = await GET(req as any, { params });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Invalid query parameters');
    });
  });
});