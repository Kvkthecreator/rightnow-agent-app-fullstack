import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { PipelineBoundaryGuard } from "@/lib/canon/PipelineBoundaryGuard";
import { createTimelineEmitter } from "@/lib/canon/TimelineEventEmitter";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST accept block - Route through lifecycle service
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: blockId } = await context.params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get workspace" },
        { status: 500 }
      );
    }

    // Verify block exists and user has access via basket
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .select("id, basket_id, status, workspace_id")
      .eq("id", blockId)
      .single();

    if (blockError || !block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    // Verify basket access
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("id")
      .eq("id", block.basket_id)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Pipeline boundary enforcement: P1 Substrate state changes
    PipelineBoundaryGuard.enforceP1Substrate({
      type: 'block.accept',
      payload: { blockId, old_status: block.status, new_status: 'accepted' },
      context: { basket_id: block.basket_id, workspace_id: workspace.id }
    });

    // Update block status through lifecycle service
    const { data: updatedBlock, error: updateError } = await supabase
      .from("blocks")
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString(),
        metadata: {
          ...(block as any).metadata,
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        }
      })
      .eq("id", blockId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to accept block:", updateError);
      return NextResponse.json(
        { error: "Failed to accept block" },
        { status: 500 }
      );
    }

    // Emit canonical timeline event (P1 Substrate pipeline)
    const timelineEmitter = createTimelineEmitter(supabase);
    await timelineEmitter.emitBlockStateChanged({
      basket_id: block.basket_id,
      workspace_id: workspace.id,
      block_id: blockId,
      old_state: block.status,
      new_state: 'accepted'
    });

    console.log(`✅ Block ${blockId} accepted by ${user.id}`);

    return NextResponse.json({
      success: true,
      block: updatedBlock,
      message: "Block accepted successfully"
    });

  } catch (error) {
    console.error("❌ Block accept error:", error);
    return NextResponse.json(
      { 
        error: "Failed to accept block",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}