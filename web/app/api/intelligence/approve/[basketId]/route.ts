import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { approveIntelligenceChanges } from "@/lib/intelligence/intelligenceEvents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ basketId: string }> }
) {
  try {
    const { basketId } = await params;
    const supabase = createServerSupabaseClient();
    
    // Authentication check
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

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { eventId, sections = [], partialApproval = false } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Verify basket access
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("id")
      .eq("id", basketId)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
      );
    }

    // Approve the intelligence changes
    const approvalEvent = await approveIntelligenceChanges(
      supabase,
      basketId,
      workspace.id,
      eventId,
      sections,
      user.id,
      partialApproval
    );

    // Log approval action
    console.log(`Intelligence approved for basket ${basketId}:`, {
      eventId,
      sections,
      partialApproval,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      approvalEvent: {
        id: approvalEvent.id,
        timestamp: approvalEvent.timestamp,
        approvalState: approvalEvent.approvalState
      },
      approvedSections: sections,
      partialApproval
    });

  } catch (error) {
    console.error("Intelligence approval API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}