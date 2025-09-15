export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { routeChange } from '@/lib/governance/decisionGateway';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ops) || !body.basket_id) {
      return NextResponse.json({ error: 'basket_id and ops[] required' }, { status: 422 });
    }

    // Route through governance Decision Gateway
    const changeDescriptor = {
      entry_point: 'manual_edit',
      actor_id: userId,
      workspace_id: workspace.id,
      basket_id: body.basket_id,
      blast_radius: 'Scoped',
      ops: body.ops,
      provenance: body.provenance || []
    };

    const result = await routeChange(supabase, changeDescriptor as any);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error('Maintenance proposal error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

