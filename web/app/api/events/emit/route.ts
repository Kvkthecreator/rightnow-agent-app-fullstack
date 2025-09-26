import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';

const VALID_TYPES = new Set(['job_update', 'system_alert', 'action_result', 'collab_activity', 'validation']);
const VALID_SEVERITIES = new Set(['info', 'success', 'warning', 'error']);
const VALID_PHASES = new Set(['started', 'progress', 'succeeded', 'failed']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type = String(body?.type || '').trim();
    const name = String(body?.name || '').trim();
    const message = String(body?.message || '').trim();

    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'invalid_event_type' }, { status: 422 });
    }
    if (!name) {
      return NextResponse.json({ error: 'event_name_required' }, { status: 422 });
    }
    if (!message) {
      return NextResponse.json({ error: 'event_message_required' }, { status: 422 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();

    const severity = VALID_SEVERITIES.has(body?.severity) ? body.severity : 'info';
    const phase = body?.phase && VALID_PHASES.has(body.phase) ? body.phase : null;

    const record = {
      type,
      name,
      message,
      severity,
      phase,
      workspace_id: workspace.id,
      basket_id: body?.basket_id || null,
      entity_id: body?.entity_id || null,
      correlation_id: body?.correlation_id || null,
      dedupe_key: body?.dedupe_key || null,
      ttl_ms: typeof body?.ttl_ms === 'number' ? body.ttl_ms : null,
      payload: body?.payload || null,
    };

    const cleanRecord = Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== undefined)
    );

    const { data, error } = await serviceClient
      .from('app_events')
      .insert(cleanRecord)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to persist app event:', error);
      return NextResponse.json({ error: 'event_persist_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, event_id: data?.id });
  } catch (error) {
    console.error('Event emission error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
