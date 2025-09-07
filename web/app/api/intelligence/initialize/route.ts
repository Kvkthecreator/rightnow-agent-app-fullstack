import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { routeIntelligenceWork, createIntelligenceWorkRequest } from "@/lib/intelligence/universalIntelligenceRouter";

interface InitializeRequest {
  intelligence: {
    themes: string[];
    context_items: Array<{
      type: string;
      content: string;
      relevance_score: number;
    }>;
    patterns: Array<{
      pattern_type: string;
      description: string;
      confidence: number;
    }>;
    confidence_score: number;
  };
  suggested_structure: {
    documents: Array<{
      title: string;
      type: string;
      description: string;
      initial_content: string;
      relevance: number;
    }>;
    organization: {
      suggested_name: string;
      description: string;
      organization_strategy: string;
    };
  };
  user_modifications?: {
    basket_name?: string;
    selected_documents?: string[];
    additional_context?: string;
  };
  raw_dump?: {
    body_md: string;
    file_url?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
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

    // Ensure workspace exists
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const body: InitializeRequest = await request.json();
    const { intelligence, suggested_structure, user_modifications, raw_dump } = body;

    // Validate required data
    if (!intelligence || !suggested_structure) {
      return NextResponse.json(
        { error: "Intelligence data and suggested structure are required" },
        { status: 400 }
      );
    }

    // Create the basket
    const basketName = user_modifications?.basket_name || suggested_structure.organization.suggested_name;

    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .insert({
        name: basketName,
        status: "ACTIVE",
        workspace_id: workspace.id
      })
      .select()
      .single();

    if (basketError || !basket) {
      console.error("Basket creation error:", basketError);
      return NextResponse.json(
        { error: "Failed to create initial basket" },
        { status: 500 }
      );
    }

    // Prepare substrate operations for governance routing
    const substrateOperations = [];

    // Raw dump creation (if provided)
    if (raw_dump) {
      substrateOperations.push({
        type: 'create_raw_dumps' as const,
        data: {
          basket_id: basket.id,
          workspace_id: workspace.id,
          body_md: raw_dump.body_md,
          file_url: raw_dump.file_url || null
        },
        confidence: 0.95
      });
    }

    // Context items creation
    const contextItemsData = intelligence.context_items.map(item => ({
      basket_id: basket.id,
      type: item.type,
      content: item.content,
      status: 'active',
      workspace_id: workspace.id
    }));

    if (contextItemsData.length > 0) {
      substrateOperations.push({
        type: 'create_context_items' as const,
        data: { items: contextItemsData },
        confidence: 0.8
      });
    }

    // Create documents
    const selectedDocuments = user_modifications?.selected_documents || 
      suggested_structure.documents.map(doc => doc.title);
    
    const documentsToCreate = suggested_structure.documents.filter(doc => 
      selectedDocuments.includes(doc.title)
    );

    const createdDocuments = [];
    for (const docSuggestion of documentsToCreate) {
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          title: docSuggestion.title,
          content_raw: docSuggestion.initial_content,
          document_type: docSuggestion.type,
          basket_id: basket.id,
          workspace_id: workspace.id,
          metadata: {
            created_via: 'universal_intelligence',
            description: docSuggestion.description,
            relevance: docSuggestion.relevance,
            ai_generated: true
          }
        })
        .select()
        .single();

      if (docError) {
        console.error(`Document creation error for ${docSuggestion.title}:`, docError);
        continue; // Skip failed documents but continue with others
      }

      if (document) {
        createdDocuments.push(document);
      }
    }

    // Blocks creation from patterns
    const blocksData = intelligence.patterns.map(pattern => ({
      basket_id: basket.id,
      semantic_type: 'insight',
      content: `${pattern.description} (Confidence: ${Math.round(pattern.confidence * 100)}%)`,
      state: 'ACCEPTED',
      workspace_id: workspace.id,
      meta_agent_notes: JSON.stringify({
        pattern_type: pattern.pattern_type,
        confidence: pattern.confidence,
        created_via: 'universal_intelligence'
      })
    }));

    if (blocksData.length > 0) {
      substrateOperations.push({
        type: 'create_blocks' as const,
        data: { blocks: blocksData },
        confidence: intelligence.confidence_score || 0.7
      });
    }

    // Route substrate operations through governance (Canon v2.2 compliant)
    let substrateWorkResult = null;
    if (substrateOperations.length > 0) {
      try {
        const workRequest = createIntelligenceWorkRequest(
          substrateOperations,
          basket.id,
          {
            confidence_score: intelligence.confidence_score || 0.8,
            user_override: 'allow_auto', // Intelligence initialization can auto-execute
            trace_id: `intelligence-init-${Date.now()}`,
            provenance: raw_dump ? [`intelligence-analysis`] : []
          }
        );

        substrateWorkResult = await routeIntelligenceWork(workRequest);
      } catch (error) {
        console.error("Substrate creation via governance failed:", error);
        // Continue with document creation even if substrate operations fail
      }
    }

    // Generate success response (Canon v2.2 compliant)
    const result = {
      basket: {
        id: basket.id,
        name: basket.name,
        status: basket.status,
        created_at: basket.created_at
      },
      documents: createdDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.document_type
      })),
      substrate_work: substrateWorkResult ? {
        work_id: substrateWorkResult.work_id,
        routing_decision: substrateWorkResult.routing_decision,
        execution_mode: substrateWorkResult.execution_mode,
        status_url: substrateWorkResult.status_url,
        operations_planned: substrateOperations.length
      } : null,
      intelligence_summary: {
        themes_count: intelligence.themes.length,
        confidence_score: intelligence.confidence_score,
        patterns_identified: intelligence.patterns.length
      },
      next_steps: generateNextSteps(intelligence, createdDocuments),
      governance_compliance: {
        substrate_operations_routed: substrateOperations.length,
        artifacts_created_directly: createdDocuments.length,
        canon_version: "v2.2"
      }
    };

    return NextResponse.json({
      success: true,
      result,
      message: substrateWorkResult 
        ? `Basket initialized successfully. Substrate operations ${substrateWorkResult.execution_mode === 'auto_execute' ? 'executed' : 'queued for review'}.`
        : "Basket initialized successfully with documents only."
    });

  } catch (error) {
    console.error("Basket initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize basket",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function generateNextSteps(
  intelligence: any,
  createdDocuments: any[]
): string[] {
  const steps = [];
  
  // Document-specific next steps
  if (createdDocuments.length > 0) {
    steps.push(`Review and customize the ${createdDocuments.length} generated documents`);
    
    if (createdDocuments.some(doc => doc.document_type === 'strategy')) {
      steps.push("Define specific strategic objectives in your strategy documents");
    }
    
    if (createdDocuments.some(doc => doc.document_type === 'planning')) {
      steps.push("Add timeline and milestones to your implementation plan");
    }
  }
  
  // Intelligence-based next steps
  if (intelligence.confidence_score > 0.8) {
    steps.push("Leverage the high-confidence AI insights to accelerate your planning");
  } else {
    steps.push("Add more context to improve AI analysis and suggestions");
  }
  
  // Theme-based next steps
  if (intelligence.themes.length > 3) {
    steps.push("Consider organizing themes into phases or priorities");
  }
  
  // General next steps
  steps.push("Invite team members to collaborate on the basket");
  steps.push("Start adding your own content and insights");
  
  return steps.slice(0, 5); // Limit to 5 next steps
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}