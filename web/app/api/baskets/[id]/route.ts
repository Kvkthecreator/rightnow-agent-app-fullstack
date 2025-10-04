import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { loadBasketModeConfig } from '@/basket-modes/loader';
import type { BasketModeId } from '@/basket-modes/types';

interface RouteContext { params: Promise<{ id: string }> }

// GET /api/baskets/[id] — fetch basket details within the user's workspace
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerSupabaseClient() as any;
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    const { data: basket, error } = await supabase
      .from('baskets')
      .select('id,name,workspace_id,status,created_at,mode')
      .eq('id', id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!basket) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (basket.workspace_id !== workspace.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Check if mode has setup wizard enabled
    let hasSetupWizard = false;
    try {
      const modeId = (basket.mode ?? 'default') as BasketModeId;
      const modeConfig = await loadBasketModeConfig(modeId);
      hasSetupWizard = modeConfig.wizards?.setup?.enabled ?? false;
    } catch (error) {
      console.warn('Could not load mode config for wizard check', error);
    }

    return NextResponse.json({
      id: basket.id,
      name: basket.name,
      status: basket.status,
      created_at: basket.created_at,
      mode: basket.mode,
      has_setup_wizard: hasSetupWizard,
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
