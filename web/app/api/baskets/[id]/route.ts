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
    const { data: basket, error: fetchError } = await supabase
      .from("baskets")
      .select("id, name, description, status, created_at, updated_at, metadata")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .single();

    if (fetchError || !basket) {
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(basket);

  } catch (error) {
    console.error("Basket GET API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH/PUT update basket (including name changes)
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const updates: Record<string, any> = {};
    
    // Allow updating specific fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }
    
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    // Update basket
    const { data: basket, error: updateError } = await supabase
      .from("baskets")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .select("id, name, description, status, created_at, updated_at")
      .single();

    if (updateError || !basket) {
      console.error("Basket update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update basket" },
        { status: 500 }
      );
    }

    return NextResponse.json(basket);

  } catch (error) {
    console.error("Basket PATCH API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
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