import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId } = await ctx.params;
    const searchParams = new URL(req.url).searchParams;
    const status = searchParams.get('status');
    const kind = searchParams.get('kind');
    
    const user = await auth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    
    let query = supabase
      .from('proposals')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (kind) {
      query = query.eq('proposal_kind', kind);
    }

    const { data: proposals, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
    }

    // Transform proposals to match canon contract format
    const items = proposals?.map(proposal => ({
      id: proposal.id,
      proposal_kind: proposal.proposal_kind,
      origin: proposal.origin,
      status: proposal.status,
      ops_summary: generateOpsSummary(proposal.ops),
      confidence: proposal.validator_report?.confidence || 0.5,
      impact_summary: proposal.validator_report?.impact_summary || "Impact unknown",
      created_at: proposal.created_at,
      validator_report: proposal.validator_report,
      provenance: proposal.provenance
    })) || [];

    return NextResponse.json({ items });

  } catch (error) {
    console.error('Proposals fetch error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext
) {
  try {
    const { id: basketId } = await ctx.params;
    const { 
      proposal_kind, 
      ops, 
      origin = 'human',
      provenance = [],
      basis_snapshot_id 
    } = await req.json();
    
    const user = await auth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement agent validation pipeline
    // For now, create basic validator report
    const validator_report = {
      confidence: 0.7,
      dupes: [],
      ontology_hits: [],
      suggested_merges: [],
      warnings: [],
      impact_summary: "Manual proposal - validation pending"
    };

    const supabase = createClient();
    
    // Get workspace_id for the basket
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('workspace_id')
      .eq('id', basketId)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: "Basket not found" }, { status: 404 });
    }

    // Create proposal
    const { data: proposal, error: createError } = await supabase
      .from('proposals')
      .insert({
        basket_id: basketId,
        workspace_id: basket.workspace_id,
        proposal_kind,
        ops,
        origin,
        provenance,
        basis_snapshot_id,
        validator_report,
        created_by: user.id,
        status: 'PROPOSED'
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
    }

    // Emit governance timeline event
    const { error: timelineError } = await supabase.rpc('emit_timeline_event', {
      p_basket_id: basketId,
      p_event_type: 'proposal.submitted',
      p_event_data: {
        proposal_id: proposal.id,
        proposal_kind,
        origin
      },
      p_workspace_id: basket.workspace_id,
      p_actor_id: user.id
    });

    if (timelineError) {
      console.error('Failed to emit timeline event:', timelineError);
    }

    return NextResponse.json({ 
      success: true,
      proposal_id: proposal.id,
      status: 'PROPOSED'
    });

  } catch (error) {
    console.error('Proposal creation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateOpsSummary(ops: any[]): string {
  if (!Array.isArray(ops) || ops.length === 0) {
    return "No operations";
  }
  
  const opCounts = ops.reduce((acc, op) => {
    acc[op.type] = (acc[op.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(opCounts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');
}
