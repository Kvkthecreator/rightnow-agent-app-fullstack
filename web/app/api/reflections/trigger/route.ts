export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { ReflectionEngine } from '@/lib/server/ReflectionEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const basket_id = body?.basket_id as string | undefined;
    const force_refresh = Boolean(body?.force_refresh);
    const substrate_window_hours = typeof body?.substrate_window_hours === 'number' ? body.substrate_window_hours : undefined;

    if (!basket_id) {
      return NextResponse.json({ error: 'basket_id required' }, { status: 422 });
    }

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

    const engine = new ReflectionEngine();
    const result = await engine.computeReflection(basket_id, basket.workspace_id, {
      force_refresh,
      substrate_window_hours,
    });

    return NextResponse.json({ success: true, reflection: result }, { status: 200 });
  } catch (error) {
    console.error('Reflections trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

