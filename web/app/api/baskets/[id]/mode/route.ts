import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';

const UpdateModeSchema = z.object({
  mode: z.enum(['default', 'product_brain', 'campaign_brain']),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    return NextResponse.json({ error: 'workspace_not_found' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = UpdateModeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_mode', details: parsed.error.flatten() }, { status: 422 });
  }

  const { data: basket, error: selectError } = await supabase
    .from('baskets')
    .select('id, workspace_id')
    .eq('id', id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 400 });
  }
  if (!basket || basket.workspace_id !== workspace.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('baskets')
    .update({ mode: parsed.data.mode })
    .eq('id', id)
    .select('id, name, status, mode, created_at')
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(updated, { status: 200 });
}
