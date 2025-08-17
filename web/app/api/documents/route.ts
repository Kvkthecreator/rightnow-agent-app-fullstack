import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getWorkspaceFromBasket } from "@/lib/utils/workspace";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Use getUser() for secure authentication
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

    // Get basketId from query params
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');

    if (!basketId) {
      return NextResponse.json(
        { error: "basketId is required" },
        { status: 400 }
      );
    }

    // Validate basket access and get workspace_id
    const basketResult = await getWorkspaceFromBasket(supabase, basketId);
    if ('error' in basketResult) {
      return NextResponse.json(
        { error: basketResult.error },
        { status: 404 }
      );
    }
    
    const { workspaceId } = basketResult;
    
    // Verify user has access to this workspace
    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { error: "Unauthorized access to workspace" },
        { status: 403 }
      );
    }

    // Get documents for this basket (now with validated access)
    const { data: documents, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("basket_id", basketId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Documents fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || []);

  } catch (error) {
    console.error("Documents GET API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method DELETED - All document creation now goes through Universal Change System
// Previous POST functionality has been migrated to /api/changes endpoint
// Use useUniversalChanges.createDocument() instead of direct POST calls