export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTestAwareAuth } from '@/lib/auth/testHelpers';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import {
  createTimelineCursor,
  parseTimelineCursor,
  type TimelineCursor
} from '../../../../../../shared/contracts/timeline';
// NOTE: we’ll return plain JSON to avoid strict enum validation until kinds are normalized
import { z } from 'zod';

const TimelineQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  event_types: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { userId, isTest } = await getTestAwareAuth(supabase);
  const ws = isTest ? { id: '00000000-0000-0000-0000-000000000002' } : await ensureWorkspaceForUser(userId, supabase);

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
  if (cursor) {
    try {
      const parsed = parseTimelineCursor(cursor as TimelineCursor);
      cursorTimestamp = parsed.timestamp;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid cursor format' }, { status: 422 });
    }
  }

  // Query timeline_events table with proper filtering (Canon v1.3.1 compliance)
  let q = supabase
    .from('timeline_events')
    .select('id, basket_id, kind, payload, ts, preview, ref_id')
    .eq('basket_id', id)
    .order('ts', { ascending: false })
    .order('id', { ascending: false }) // Secondary sort for stable pagination
    .limit(limit + 1); // Fetch one extra to check if there's more

  // Apply cursor if provided
  if (cursorTimestamp) {
    // Simpler and safe; we can add tie-breaker once kinds are normalized
    q = q.lt('ts', cursorTimestamp);
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

  const timelineEvents = results.map(e => ({
    id: e.id,
    basket_id: e.basket_id,
    event_type: e.kind,          // leave as-is for now to avoid enum mismatches
    event_data: e.payload || {},
    created_at: e.ts,
    preview: e.preview,
    ref_id: e.ref_id,
  }));

  const next_cursor = has_more && results.length > 0
    ? createTimelineCursor(timelineEvents[timelineEvents.length - 1])
    : undefined;

  // For backwards compatibility, also include last_cursor
  const last_cursor = results.length > 0
    ? createTimelineCursor(timelineEvents[timelineEvents.length - 1])
    : undefined;

  return NextResponse.json({
    events: timelineEvents,
    has_more,
    next_cursor,
    last_cursor,
  }, { status: 200 });
}
