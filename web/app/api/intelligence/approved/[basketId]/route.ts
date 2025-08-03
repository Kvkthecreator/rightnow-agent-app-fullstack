import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getLastApprovedIntelligence, getIntelligenceHistorySummary } from "@/lib/intelligence/intelligenceEvents";

export async function GET(
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

    // Get last approved intelligence
    const approvedIntelligence = await getLastApprovedIntelligence(supabase, basketId);
    
    if (!approvedIntelligence) {
      return NextResponse.json(
        { error: "No approved intelligence found" },
        { status: 404 }
      );
    }

    // Get summary information
    const summary = await getIntelligenceHistorySummary(supabase, basketId);

    return NextResponse.json({
      intelligence: approvedIntelligence,
      lastApprovalDate: summary.lastApprovalDate,
      summary
    });

  } catch (error) {
    console.error("Approved intelligence API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}