export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

type Q = { limit?: string | null; before?: string | null; kind?: string | string[] | null };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient();
  const { id } = await params;
  const { userId } = await getAuthenticatedUser(supabase);
  const ws = await ensureWorkspaceForUser(userId, supabase);

  // Validate basket in this workspace (RLS still protects)
  const { data: basket, error: bErr } = await supabase
    .from('baskets')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', ws.id)
    .maybeSingle();

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
  if (!basket) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Query params
  const url = new URL(req.url);
  const qp: Q = {
    limit: url.searchParams.get('limit'),
    before: url.searchParams.get('before'),
    kind: url.searchParams.getAll('kind')?.length ? url.searchParams.getAll('kind') : url.searchParams.get('kind'),
  };

  const limitRaw = Number.parseInt(qp.limit ?? '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;

  let q = supabase
    .from('basket_history')
    .select('id, ts, kind, ref_id, preview, payload')
    .eq('basket_id', id)
    .order('ts', { ascending: false })
    .limit(limit);

  if (qp.before) q = q.lt('ts', qp.before);
  const kinds = Array.isArray(qp.kind) ? qp.kind : qp.kind ? [qp.kind] : [];
  if (kinds.length) q = q.in('kind', kinds);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const next_before = data && data.length ? data[data.length - 1].ts : null;
  return NextResponse.json({ items: data ?? [], next_before });
}
