import { DashboardQueries } from '@/lib/server/dashboard/queries';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
(cookies as jest.Mock).mockReturnValue({});

describe('DashboardQueries', () => {
  let queries: DashboardQueries;
  
  beforeEach(() => {
    queries = new DashboardQueries();
    jest.clearAllMocks();
  });

  describe('getBasketHealth', () => {
    it('should calculate health metrics correctly', async () => {
      const basketId = 'basket-123';
      const mockDumps = [
        { created_at: '2025-01-01T12:00:00Z', text_dump: 'Hello world', file_url: null },
        { created_at: '2025-01-01T11:00:00Z', text_dump: null, file_url: 'file.pdf' }
      ];
      const mockReflections = [
        { computation_timestamp: '2025-01-01T13:00:00Z' }
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockDumps })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockReflections })
            })
          })
        });

      const health = await queries.getBasketHealth(basketId);

      expect(health.dump_count).toBe(2);
      expect(health.reflection_count).toBe(1);
      expect(health.latest_dump_at).toBe('2025-01-01T12:00:00Z');
      expect(health.latest_reflection_at).toBe('2025-01-01T13:00:00Z');
      expect(health.total_chars).toBe(19); // 'Hello world'.length + 'file.pdf'.length
      expect(health.activity_score).toBeGreaterThan(0);
    });

    it('should handle empty basket data', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [] })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [] })
            })
          })
        });

      const health = await queries.getBasketHealth('empty-basket');

      expect(health.dump_count).toBe(0);
      expect(health.reflection_count).toBe(0);
      expect(health.latest_dump_at).toBeNull();
      expect(health.latest_reflection_at).toBeNull();
      expect(health.total_chars).toBe(0);
      expect(health.activity_score).toBe(0);
    });
  });

  describe('getRecentDumps', () => {
    it('should return formatted dump summaries', async () => {
      const basketId = 'basket-123';
      const mockDumps = [
        {
          id: 'dump-1',
          created_at: '2025-01-01T12:00:00Z',
          text_dump: 'Test content',
          file_url: null
        },
        {
          id: 'dump-2',
          created_at: '2025-01-01T11:00:00Z',
          text_dump: null,
          file_url: 'https://example.com/file.pdf'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockDumps, error: null })
            })
          })
        })
      });

      const dumps = await queries.getRecentDumps(basketId, 2);

      expect(dumps).toHaveLength(2);
      expect(dumps[0].id).toBe('dump-1');
      expect(dumps[0].char_count).toBe(12); // 'Test content'.length
      expect(dumps[0].is_processed).toBe(true);
      expect(dumps[1].char_count).toBe(28); // 'https://example.com/file.pdf'.length
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(queries.getRecentDumps('basket-123', 3))
        .rejects.toThrow('Failed to fetch recent dumps: Database error');
    });
  });

  describe('getMostRecentReflection', () => {
    it('should return formatted reflection summary', async () => {
      const basketId = 'basket-123';
      const mockReflection = {
        id: 'reflection-1',
        reflection_text: 'This is a reflection...',
        computation_timestamp: '2025-01-01T13:00:00Z',
        substrate_window_start: '2025-01-01T12:00:00Z',
        substrate_window_end: '2025-01-01T13:00:00Z',
        meta: { computation_trace_id: 'trace-123' }
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: mockReflection, error: null })
              })
            })
          })
        })
      });

      const reflection = await queries.getMostRecentReflection(basketId);

      expect(reflection).not.toBeNull();
      expect(reflection!.id).toBe('reflection-1');
      expect(reflection!.reflection_text).toBe('This is a reflection...');
      expect(reflection!.meta.computation_trace_id).toBe('trace-123');
    });

    it('should return null when no reflections exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          })
        })
      });

      const reflection = await queries.getMostRecentReflection('basket-123');

      expect(reflection).toBeNull();
    });
  });

  describe('getRecentTimelineEvents', () => {
    it('should return formatted timeline events', async () => {
      const basketId = 'basket-123';
      const mockEvents = [
        {
          id: 'event-1',
          kind: 'dump.created',
          ts: '2025-01-01T12:00:00Z',
          payload: { char_count: 100 },
          actor_id: 'user-123',
          origin: 'user'
        },
        {
          id: 'event-2',
          kind: 'reflection.computed',
          ts: '2025-01-01T13:00:00Z',
          payload: { reflection_id: 'reflection-1' },
          actor_id: null,
          origin: 'system'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
            })
          })
        })
      });

      const events = await queries.getRecentTimelineEvents(basketId, 5);

      expect(events).toHaveLength(2);
      expect(events[0].event_type).toBe('dump.created');
      expect(events[0].preview).toBe('Added 100 characters of content');
      expect(events[1].event_type).toBe('reflection.computed');
      expect(events[1].preview).toBe('New reflection computed from recent substrate');
    });

    it('should handle unknown event types', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          kind: 'unknown.event',
          ts: '2025-01-01T12:00:00Z',
          payload: {},
          actor_id: null,
          origin: 'system'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
            })
          })
        })
      });

      const events = await queries.getRecentTimelineEvents('basket-123', 5);

      expect(events[0].preview).toBe('unknown event event occurred');
    });
  });
});