import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

// GET /api/baskets/[id]/timeline?limit=50 — minimal projection to avoid 404s
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient() as any;
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);
    const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '50', 10) || 50, 200);

    // Verify basket belongs to workspace
    const { data: basket } = await supabase
      .from('baskets')
      .select('id,workspace_id')
      .eq('id', id)
      .maybeSingle();
    if (!basket) return NextResponse.json({ items: [] }, { status: 200 });
    if (basket.workspace_id !== workspace.id) return NextResponse.json({ items: [] }, { status: 200 });

    // Fetch recent timeline events (if table exists)
    const { data: events, error } = await supabase
      .from('timeline_events')
      .select('ts, kind, ref_id, preview, payload')
      .eq('basket_id', id)
      .order('ts', { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ items: [] }, { status: 200 });

    type Ev = { ts: string; kind: string; ref_id: string | null; preview: string | null; payload: any };
    const items = ((events || []) as Ev[]).map((ev: Ev) => ({
      ts: ev.ts,
      type: ev.kind,
      summary: ev.preview || ev.kind,
      ref_id: ev.ref_id,
      payload: ev.payload,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
