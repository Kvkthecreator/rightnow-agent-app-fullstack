import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Use getUser() for secure authentication (fixes the security warning)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      console.error("Workspace creation/retrieval failed");
      return NextResponse.json(
        { error: "Failed to get or create workspace" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name = "Untitled Basket",
      status = "active", 
      tags = [],
      description = "",
      text_dump = "",
      file_urls = []
    } = body;

    console.log("[/api/baskets/new] Creating basket:", { name, status, tags, userId: user.id, workspaceId: workspace.id });

    // Create basket in database
    const { data: basket, error: createError } = await supabase
      .from("baskets")
      .insert({
        name,
        description: description || text_dump, // Use text_dump as description if provided
        status,
        workspace_id: workspace.id,
        metadata: {
          createdBy: user.id,
          createdVia: text_dump ? 'dump_input' : 'new_basket_button',
          tags,
          text_dump: text_dump || undefined,
          file_urls: file_urls.length > 0 ? file_urls : undefined
        }
      })
      .select()
      .single();

    if (createError) {
      console.error("Basket creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create basket", details: createError.message },
        { status: 500 }
      );
    }

    if (!basket) {
      console.error("Basket creation returned no data");
      return NextResponse.json(
        { error: "Failed to create basket - no data returned" },
        { status: 500 }
      );
    }

    console.log("[/api/baskets/new] Basket created successfully:", basket.id);

    return NextResponse.json(
      { 
        id: basket.id,
        name: basket.name,
        status: basket.status
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Basket creation API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to create a basket." },
    { status: 405 }
  );
}