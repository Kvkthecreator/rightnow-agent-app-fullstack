export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const basket_id = body?.basket_id as string | undefined;
    const force_refresh = Boolean(body?.force_refresh);
    const substrate_window_hours = typeof body?.substrate_window_hours === 'number' ? body.substrate_window_hours : undefined;
    const scope = (body?.scope as string | undefined) || 'window';
    const event_id = body?.event_id as string | undefined;

    if (scope === 'event') {
      if (!event_id) return NextResponse.json({ error: 'event_id required for scope=event' }, { status: 422 });
      const supabase = createServerSupabaseClient();
      const { userId } = await getAuthenticatedUser(supabase);
      const workspace = await ensureWorkspaceForUser(userId, supabase);

      const { data: ev, error: eErr } = await supabase
        .from('events')
        .select('id, basket_id, workspace_id')
        .eq('id', event_id)
        .single();
      if (eErr || !ev) return NextResponse.json({ error: 'event_not_found' }, { status: 404 });
      if (ev.workspace_id !== workspace.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const backend = process.env.BACKEND_URL;
      if (!backend) return NextResponse.json({ error: 'backend_url_missing' }, { status: 500 });
      const resp = await fetch(`${backend}/api/reflections/compute_event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, event_id })
      });
      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    }

    if (!basket_id) return NextResponse.json({ error: 'basket_id required' }, { status: 422 });
const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate basket access
    const { data: basket, error: bErr } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basket_id)
      .eq('workspace_id', workspace.id)
      .maybeSingle();
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
    if (!basket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const backend = process.env.BACKEND_URL;
    if (!backend) return NextResponse.json({ error: 'backend_url_missing' }, { status: 500 });
    const resp = await fetch(`${backend}/api/reflections/compute_window`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: basket.workspace_id, basket_id, agent_id: 'p3_reflection_agent' })
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Reflections trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

