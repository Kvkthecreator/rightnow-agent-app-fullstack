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

export async function POST(request: NextRequest) {
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

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get or create workspace" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      basketId,
      basket_id,
      title = "Untitled Document",
      content = "",
      type = "document",
      document_type = "general"
    } = body;

    const finalBasketId = basketId || basket_id;

    if (!finalBasketId) {
      return NextResponse.json(
        { error: "basketId is required" },
        { status: 400 }
      );
    }

    console.log("[/api/documents] Creating document:", { basketId: finalBasketId, title, document_type, userId: user.id });

    // Create document in database
    const { data: document, error: createError } = await supabase
      .from("documents")
      .insert({
        title,
        content,
        document_type,
        basket_id: finalBasketId,
        workspace_id: workspace.id,
        metadata: {
          createdBy: user.id,
          createdVia: 'api_documents_endpoint'
        }
      })
      .select()
      .single();

    if (createError) {
      console.error("Document creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create document", details: createError.message },
        { status: 500 }
      );
    }

    if (!document) {
      console.error("Document creation returned no data");
      return NextResponse.json(
        { error: "Failed to create document - no data returned" },
        { status: 500 }
      );
    }

    console.log("[/api/documents] Document created successfully:", document.id);

    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    console.error("Documents POST API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}