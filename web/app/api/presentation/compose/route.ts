/**
 * YARNNN P4 Presentation Pipeline API
 * 
 * Sacred Principle #3: "Narrative is Deliberate"
 * Canonical implementation of "Documents = substrate references + authored prose"
 * 
 * P4 Pipeline Rules:
 * - Consumes substrate, never creates it
 * - Any substrate type can be referenced (substrate equality)
 * - Narrative provides coherent story atop substrate signals
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { DocumentComposer, type DocumentComposition } from "@/lib/presentation/DocumentComposer";

// Ensure this route is treated as dynamic (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * POST /api/presentation/compose
 * 
 * Canonical P4 Presentation endpoint for document composition
 * Implements Sacred Principle #3: Documents = substrate references + authored prose
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace access required" }, { status: 401 });
    }

    const composition: DocumentComposition = await req.json();

    // Validate required fields
    if (!composition.title) {
      return NextResponse.json({ 
        error: "Title required for document composition" 
      }, { status: 400 });
    }

    if (!composition.narrative_sections || composition.narrative_sections.length === 0) {
      return NextResponse.json({ 
        error: "At least one narrative section required (authored prose)" 
      }, { status: 400 });
    }

    // Ensure workspace alignment
    composition.workspace_id = workspace.id;
    composition.author_id = user.id;

    // Compose document through canonical P4 pipeline
    const result = await DocumentComposer.composeDocument(composition, supabase);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to compose document" 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      composition_type: 'substrate_plus_narrative',
      pipeline: 'P4_PRESENTATION'
    });

  } catch (error) {
    console.error('P4 Presentation composition error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

/**
 * GET /api/presentation/compose?document_id=xxx
 * 
 * Retrieve composed document with resolved substrate references
 * P4 read operation - composes view without creating substrate
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace access required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const document_id = searchParams.get('document_id');

    if (!document_id) {
      return NextResponse.json({ 
        error: "document_id parameter required" 
      }, { status: 400 });
    }

    // Get document with resolved substrate references
    const result = await DocumentComposer.getDocumentWithReferences(
      document_id,
      workspace.id,
      supabase
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to get document" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      pipeline: 'P4_PRESENTATION',
      composition_resolved: true
    });

  } catch (error) {
    console.error('P4 Presentation retrieval error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}