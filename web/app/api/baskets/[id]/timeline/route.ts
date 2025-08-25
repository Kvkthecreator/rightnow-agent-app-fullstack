export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { withSchema } from '@/lib/api/withSchema';
import { 
  GetTimelineResponseSchema, 
  createTimelineCursor,
  parseTimelineCursor,
  type TimelineCursor,
  type TimelineEventDTO 
} from '../../../../../../shared/contracts/timeline';
import { z } from 'zod';

const TimelineQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  event_types: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const ws = await ensureWorkspaceForUser(userId, supabase);

  // Validate basket belongs to workspace (RLS still protects)
  const { data: basket, error: bErr } = await supabase
    .from('baskets')
    .select('id, workspace_id')
    .eq('id', id)
    .eq('workspace_id', ws.id)
    .maybeSingle();

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
  if (!basket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const url = new URL(req.url);
  const queryParams = TimelineQuerySchema.safeParse({
    cursor: url.searchParams.get('cursor') || undefined,
    limit: url.searchParams.get('limit') || undefined,
    event_types: url.searchParams.getAll('event_type').length > 0 
      ? url.searchParams.getAll('event_type') 
      : undefined,
  });

  if (!queryParams.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: queryParams.error.flatten() }, { status: 422 });
  }

  const { cursor, limit = 50, event_types } = queryParams.data;

  // Parse cursor if provided
  let cursorTimestamp: string | null = null;
  let cursorEventId: string | null = null;
  if (cursor) {
    try {
      const parsed = parseTimelineCursor(cursor as TimelineCursor);
      cursorTimestamp = parsed.timestamp;
      cursorEventId = parsed.event_id;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid cursor format' }, { status: 422 });
    }
  }

  // Query timeline_events table with proper filtering (Canon v1.3.1 compliance)
  let q = supabase
    .from('timeline_events')
    .select('id, basket_id, kind, payload, ts, ref_id, preview')
    .eq('basket_id', id)
    .order('ts', { ascending: false })
    .order('id', { ascending: false }) // Secondary sort for stable pagination
    .limit(limit + 1); // Fetch one extra to check if there's more

  // Apply cursor if provided
  if (cursorTimestamp && cursorEventId) {
    // Use compound cursor (timestamp, id) for stable pagination
    q = q.or(`ts.lt.${cursorTimestamp},and(ts.eq.${cursorTimestamp},id.lt.${cursorEventId})`);
  }

  // Filter by event types if specified
  if (event_types && event_types.length > 0) {
    q = q.in('kind', event_types);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const events = data ?? [];
  const has_more = events.length > limit;
  const results = has_more ? events.slice(0, limit) : events;

  // Transform to TimelineEventDTO format
  const timelineEvents: TimelineEventDTO[] = results.map(event => ({
    id: event.id.toString(), // Convert bigint to string for UUID compatibility
    basket_id: event.basket_id,
    event_type: event.kind as any, // Will be validated by schema
    event_data: event.payload || {},
    created_at: event.ts,
    created_by: undefined, // timeline_events doesn't have actor_id, use from payload if needed
    meta: event.payload?.trace_id || event.payload?.client_ts ? {
      client_ts: event.payload?.client_ts,
      trace_id: event.payload?.trace_id,
    } : undefined,
  }));

  const next_cursor = has_more && results.length > 0
    ? createTimelineCursor(timelineEvents[timelineEvents.length - 1])
    : undefined;

  // For backwards compatibility, also include last_cursor
  const last_cursor = results.length > 0
    ? createTimelineCursor(timelineEvents[timelineEvents.length - 1])
    : undefined;

  return withSchema(GetTimelineResponseSchema, {
    events: timelineEvents,
    has_more,
    next_cursor,
    last_cursor,
  }, { status: 200 });
}
