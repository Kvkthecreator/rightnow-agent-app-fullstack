import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

// GET single basket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get workspace" },
        { status: 500 }
      );
    }

    // Get basket
    console.log(`🔍 Fetching basket ${id} for workspace ${workspace.id}`);
    
    const { data: basket, error: fetchError } = await supabase
      .from("baskets")
      .select("id, name, status, created_at, workspace_id, raw_dump_id, origin_template, tags")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .single();

    if (fetchError) {
      console.error(`❌ Basket fetch error:`, fetchError);
      
      // Try to fetch without workspace filter to debug
      const { data: anyBasket } = await supabase
        .from("baskets")
        .select("id, workspace_id")
        .eq("id", id)
        .single();
        
      if (anyBasket) {
        console.log(`⚠️ Basket exists but in different workspace: ${anyBasket.workspace_id} vs ${workspace.id}`);
      }
      
      return NextResponse.json(
        { error: "Basket not found", details: fetchError.message },
        { status: 404 }
      );
    }
    
    if (!basket) {
      console.log(`❌ No basket found with id ${id}`);
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
      );
    }

    // Map fields for API compatibility
    const mappedBasket = {
      ...basket,
      description: basket.origin_template || "", // Map origin_template to description
      updated_at: basket.created_at, // Use created_at as fallback for updated_at
      metadata: {}, // Provide empty metadata object
      origin_template: undefined // Remove internal field from response
    };

    // Add CORS headers
    const response = NextResponse.json(mappedBasket);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error("❌ Basket GET API error:", error);
    const errorResponse = NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
    
    // Add CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// PATCH method DELETED - All basket updates now go through Universal Change System
// Previous PATCH functionality has been migrated to /api/changes endpoint
// Use useUniversalChanges.updateBasket() instead of direct PATCH calls

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// DELETE basket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get workspace" },
        { status: 500 }
      );
    }

    // Delete basket (this will cascade to delete related data)
    const { error: deleteError } = await supabase
      .from("baskets")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace.id);

    if (deleteError) {
      console.error("Basket delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete basket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Basket DELETE API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}