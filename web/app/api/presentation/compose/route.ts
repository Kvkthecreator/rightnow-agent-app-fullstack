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
 * 
 * Canon v2.1 Enhancement: Async composition via Universal Work Orchestration
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

    // Ensure workspace alignment
    composition.workspace_id = workspace.id;
    composition.author_id = user.id;

    // Determine if this needs async processing
    const needsAsyncComposition = !composition.substrate_references || composition.substrate_references.length === 0;
    
    if (needsAsyncComposition && composition.composition_context?.intent) {
      // Create document shell immediately
      const documentShell = await DocumentComposer.createDocumentShell({
        title: composition.title,
        workspace_id: workspace.id,
        basket_id: composition.basket_id!,
        author_id: user.id,
        composition_context: composition.composition_context,
        initial_prose: composition.narrative_sections?.[0]?.content || ''
      }, supabase);

      if (!documentShell.success || !documentShell.document) {
        return NextResponse.json({ 
          error: documentShell.error || "Failed to create document" 
        }, { status: 400 });
      }

      // Queue P4_COMPOSE work for async processing
      // Use same-origin API for work orchestration to avoid env coupling
      const origin = new URL(req.url).origin;
      const workResponse = await fetch(`${origin}/api/work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          work_type: 'P4_COMPOSE',
          work_payload: {
            operations: [{
              type: 'compose_from_memory',
              data: {
                document_id: documentShell.document.id,
                intent: composition.composition_context.intent,
                window: composition.composition_context.window,
                pinned_ids: composition.composition_context.pinned_ids
              }
            }],
            basket_id: composition.basket_id!,
            confidence_score: 0.0, // Will be determined by agent
            trace_id: composition.composition_context.trace_id
          },
          priority: 'normal'
        })
      });

      if (!workResponse.ok) {
        // Still return document but warn about composition
        console.error('Failed to queue composition work:', await workResponse.text());
        return NextResponse.json({
          success: true,
          document: documentShell.document,
          composition_type: 'async_pending',
          pipeline: 'P4_PRESENTATION',
          warning: 'Document created but composition queuing failed'
        });
      }

      const workData = await workResponse.json();

      return NextResponse.json({
        success: true,
        document: documentShell.document,
        composition_type: 'async_processing',
        pipeline: 'P4_PRESENTATION',
        work_id: workData.work_id,
        status_url: workData.status_url,
        message: 'Document created. Intelligent composition in progress...'
      }, { status: 202 }); // 202 Accepted for async processing

    } else {
      // Synchronous composition (has substrate refs or no intent)
      // Ensure we have narrative sections for backward compatibility
      if (!composition.narrative_sections || composition.narrative_sections.length === 0) {
        composition.narrative_sections = [{
          id: 'default',
          content: composition.composition_context?.intent || 'Document content',
          order: 0
        }];
      }

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
    }

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