import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
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

    // Get basketId from query params
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');

    if (!basketId) {
      return NextResponse.json(
        { error: "basketId is required" },
        { status: 400 }
      );
    }

    // Get documents for this basket
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