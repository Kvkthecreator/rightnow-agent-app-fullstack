import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST reject block - Route through lifecycle service
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

    // Update block status through lifecycle service
    const { data: updatedBlock, error: updateError } = await supabase
      .from("blocks")
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString(),
        metadata: {
          ...(block as any).metadata,
          rejected_by: user.id,
          rejected_at: new Date().toISOString()
        }
      })
      .eq("id", blockId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to reject block:", updateError);
      return NextResponse.json(
        { error: "Failed to reject block" },
        { status: 500 }
      );
    }

    // Log the lifecycle event
    await supabase
      .from("events")
      .insert({
        basket_id: block.basket_id,
        block_id: blockId,
        workspace_id: block.workspace_id,
        kind: "block.rejected",
        payload: {
          block_id: blockId,
          user_id: user.id,
          previous_status: block.status,
          new_status: 'rejected'
        },
        origin: "user",
        actor_id: user.id,
      });

    console.log(`❌ Block ${blockId} rejected by ${user.id}`);

    return NextResponse.json({
      success: true,
      block: updatedBlock,
      message: "Block rejected successfully"
    });

  } catch (error) {
    console.error("❌ Block reject error:", error);
    return NextResponse.json(
      { 
        error: "Failed to reject block",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}