import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

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

    // Optionally create raw dump
    if (raw_dump) {
      const { error: dumpError } = await supabase
        .from('raw_dumps')
        .insert({
          basket_id: basket.id,
          workspace_id: workspace.id,
          body_md: raw_dump.body_md,
          file_url: raw_dump.file_url || null
        });
      if (dumpError) {
        console.error('Raw dump creation error:', dumpError);
      }
    }

    // Create context items
    const contextItemsData = intelligence.context_items.map(item => ({
      basket_id: basket.id,
      type: item.type,
      content: item.content,
      status: 'active'
    }));

    const { data: contextItems, error: contextError } = await supabase
      .from("context_items")
      .insert(contextItemsData)
      .select();

    if (contextError) {
      console.error("Context items creation error:", contextError);
      // Continue with creation even if context items fail
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

    // Create blocks from patterns (optional enhancement)
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

    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .insert(blocksData)
      .select();

    if (blocksError) {
      console.error("Blocks creation error:", blocksError);
      // Continue even if blocks fail
    }

    // Generate success response
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
      context_items: contextItems?.length || 0,
      blocks_created: blocks?.length || 0,
      intelligence_summary: {
        themes_count: intelligence.themes.length,
        confidence_score: intelligence.confidence_score,
        patterns_identified: intelligence.patterns.length
      },
      next_steps: generateNextSteps(intelligence, createdDocuments)
    };

    return NextResponse.json({
      success: true,
      result,
      message: "Basket initialized successfully"
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