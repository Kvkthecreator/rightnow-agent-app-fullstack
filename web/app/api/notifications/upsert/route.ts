export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/clients';

/**
 * Upsert notifications using service role after validating user + workspace access.
 * Accepts array of DB-shaped rows (as produced by mapToDatabase in notification store).
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    const rows = Array.isArray(payload?.notifications) ? payload.notifications : [];
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, saved: 0 }, { status: 200 });
    }

    const userClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All rows must target same workspace_id; enforce and validate membership
    const workspaceId = rows[0].workspace_id;
    if (!workspaceId || rows.some((r: any) => r.workspace_id !== workspaceId)) {
      return NextResponse.json({ error: 'Invalid workspace context' }, { status: 400 });
    }

    // Validate membership
    const { data: membership } = await userClient
      .from('workspace_memberships')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize rows: enforce user_id = auth.uid(), ensure cross_page_persist boolean
    const toSave = rows.map((r: any) => ({
      ...r,
      user_id: user.id,
      cross_page_persist: !!r.cross_page_persist,
    }));

    const service = createServiceRoleClient();
    const { error } = await service
      .from('user_notifications')
      .upsert(toSave, { onConflict: 'id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: toSave.length }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

