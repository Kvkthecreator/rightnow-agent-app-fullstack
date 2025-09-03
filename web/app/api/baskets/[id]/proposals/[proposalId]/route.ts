import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: basketId, proposalId } = await context.params;
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basketId)
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        id,
        proposal_kind,
        origin,
        status,
        blast_radius,
        ops,
        validator_report,
        provenance,
        created_at,
        created_by,
        basket_id,
        workspace_id
      `)
      .eq('id', proposalId)
      .eq('basket_id', basketId)
      .eq('workspace_id', workspace.id)
      .single();

    if (proposalError || !proposal) {
      console.error('Proposal fetch error:', proposalError);
      return NextResponse.json({ 
        error: 'Proposal not found',
        details: proposalError?.message 
      }, { status: 404 });
    }

    return NextResponse.json(proposal);

  } catch (error) {
    console.error('Proposal detail API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch proposal details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}