export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

type Q = { limit?: string | null; before?: string | null; kind?: string | string[] | null };

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const ws = await ensureWorkspaceForUser(userId, supabase);

  // Validate basket belongs to workspace (RLS still protects)
  const { data: basket, error: bErr } = await supabase
    .from('baskets')
    .select('id, workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', ws.id)
    .maybeSingle();

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
  if (!basket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const url = new URL(req.url);
  const qp: Q = {
    limit: url.searchParams.get('limit'),
    before: url.searchParams.get('before'),
    kind: url.searchParams.getAll('kind')?.length ? url.searchParams.getAll('kind') : url.searchParams.get('kind'),
  };

  const limitRaw = Number.parseInt(qp.limit ?? '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;

  // Defensive parse of 'before'
  let beforeISO: string | null = null;
  if (qp.before) {
    const d = new Date(qp.before);
    if (!Number.isNaN(d.getTime())) beforeISO = d.toISOString();
  }

  const kinds = Array.isArray(qp.kind) ? qp.kind : qp.kind ? [qp.kind] : [];

  let q = supabase
    .from('timeline_events')
    .select('id, ts, kind, ref_id, preview, payload')
    .eq('basket_id', params.id)
    .order('ts', { ascending: false })
    .limit(limit);

  if (beforeISO) q = q.lt('ts', beforeISO);
  if (kinds.length) q = q.in('kind', kinds);

  const { data, error } = await q;
  if (error) {
    // Surface DB error text to caller for faster triage
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const next_before = data && data.length ? data[data.length - 1].ts : null;
  return NextResponse.json({ items: data ?? [], next_before }, { status: 200 });
}
