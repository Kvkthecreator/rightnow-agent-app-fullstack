import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getLastApprovedIntelligence } from "@/lib/intelligence/intelligenceEvents";

interface NextStep {
  description: string;
  priority: number;
}

interface Action {
  type: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
}

interface BasketIntelligenceDashboard {
  understanding: string;
  themes: string[];
  nextSteps: NextStep[];
  actions: Action[];
  confidenceScore: number;
  memoryGrowth: number;
  lastUpdated: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ basketId: string }> }
) {
  try {
    const { basketId } = await params;
    const supabase = createServerSupabaseClient();
    
    // Authentication check
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

    // Ensure user has workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      console.error("Workspace access failed");
      return NextResponse.json(
        { error: "Workspace access required" },
        { status: 403 }
      );
    }

    // Fetch real basket data with all related content
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select(`
        *,
        documents (
          id,
          title,
          content_raw,
          created_at
        ),
        blocks (
          id,
          semantic_type,
          content,
          canonical_value,
          created_at
        ),
        context_items (
          id,
          type,
          content,
          created_at
        )
      `)
      .eq("id", basketId)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      console.error("Basket access error:", basketError);
      return NextResponse.json(
        { error: "Basket not found or access denied" },
        { status: 404 }
      );
    }

    // Analyze real content and generate intelligence
    const intelligence = analyzeBasketContent(basket);

    console.log(`[Dashboard API] Generated real intelligence for basket ${basketId}: ${intelligence.themes.length} themes, confidence ${intelligence.confidenceScore}%`);

    return NextResponse.json(intelligence, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function analyzeBasketContent(basket: any): BasketIntelligenceDashboard {
  const documents = basket.documents || [];
  const blocks = basket.blocks || [];
  const contextItems = basket.context_items || [];
  
  // Determine basket state based on real content
  const isEmpty = documents.length === 0 && blocks.length === 0 && contextItems.length === 0;
  const isMinimal = documents.length <= 2 && blocks.length <= 5;
  const isRich = documents.length > 5 || blocks.length > 15;

  console.log(`[Analysis] Basket ${basket.id}: ${documents.length} docs, ${blocks.length} blocks, ${contextItems.length} context items`);

  if (isEmpty) {
    return generateEmptyStateIntelligence(basket);
  } else if (isMinimal) {
    return generateMinimalStateIntelligence(basket, documents, blocks, contextItems);
  } else {
    return generateRichStateIntelligence(basket, documents, blocks, contextItems);
  }
}

function generateEmptyStateIntelligence(basket: any): BasketIntelligenceDashboard {
  return {
    understanding: `I'm ready to understand your project "${basket.name || 'Untitled'}". Add some content and I'll start building intelligence about your work.`,
    themes: [],
    nextSteps: [
      { description: "Add your first document or paste some content", priority: 1 },
      { description: "Upload relevant files to build context", priority: 2 },
      { description: "Tell me about your project goals", priority: 3 }
    ],
    actions: [
      { type: "add_first_content", label: "Add Your First Content", enabled: true, primary: true },
      { type: "import_files", label: "Import Files", enabled: true },
      { type: "start_template", label: "Start with Template", enabled: true }
    ],
    confidenceScore: 0,
    memoryGrowth: 0,
    lastUpdated: new Date().toISOString()
  };
}

function generateMinimalStateIntelligence(basket: any, documents: any[], blocks: any[], contextItems: any[]): BasketIntelligenceDashboard {
  const themes = extractThemesFromContent(documents, blocks, contextItems);
  const totalItems = documents.length + blocks.length + contextItems.length;
  
  let understanding = `From your ${documents.length} document${documents.length !== 1 ? 's' : ''}`;
  if (blocks.length > 0) {
    understanding += ` and ${blocks.length} block${blocks.length !== 1 ? 's' : ''}`;
  }
  if (contextItems.length > 0) {
    understanding += ` and ${contextItems.length} context item${contextItems.length !== 1 ? 's' : ''}`;
  }
  
  if (themes.length > 0) {
    understanding += `, I can see early themes around ${themes.slice(0, 2).join(' and ')}.`;
  } else {
    understanding += `, I'm beginning to understand your project structure.`;
  }
  
  return {
    understanding,
    themes: themes,
    nextSteps: [
      { description: "Add more context to deepen my understanding", priority: 1 },
      { description: "Create additional documents to explore themes", priority: 2 },
      { description: "Define relationships between your concepts", priority: 3 }
    ],
    actions: [
      { type: "add_content", label: "Add More Context", enabled: true, primary: true },
      { type: "create_document", label: "Create Document", enabled: true },
      { type: "analyze_deeper", label: "Deep Analysis", enabled: true }
    ],
    confidenceScore: Math.min(25 + (documents.length * 8) + (blocks.length * 3) + (contextItems.length * 2), 60),
    memoryGrowth: Math.min(totalItems * 2, 15),
    lastUpdated: new Date().toISOString()
  };
}

function generateRichStateIntelligence(basket: any, documents: any[], blocks: any[], contextItems: any[]): BasketIntelligenceDashboard {
  const themes = extractThemesFromContent(documents, blocks, contextItems);
  const patterns = identifyPatterns(documents, blocks, contextItems);
  const totalItems = documents.length + blocks.length + contextItems.length;
  
  let understanding = `Analyzing ${documents.length} documents`;
  if (blocks.length > 0) {
    understanding += `, ${blocks.length} blocks`;
  }
  if (contextItems.length > 0) {
    understanding += `, and ${contextItems.length} context items`;
  }
  
  understanding += `, I understand you're working on ${themes.slice(0, 3).join(', ')}.`;
  
  if (patterns.length > 0) {
    understanding += ` I can see strong patterns around ${patterns.slice(0, 2).join(' and ')}.`;
  }
  
  return {
    understanding,
    themes: themes,
    nextSteps: [
      { description: "Create strategic synthesis document", priority: 1 },
      { description: "Identify gaps in current analysis", priority: 2 },
      { description: "Plan next phase of project development", priority: 3 }
    ],
    actions: [
      { type: "create_synthesis", label: "Create Synthesis", enabled: true, primary: true },
      { type: "find_gaps", label: "Find Gaps", enabled: true },
      { type: "strategic_planning", label: "Strategic Planning", enabled: true }
    ],
    confidenceScore: Math.min(60 + (documents.length * 3) + (blocks.length * 2) + (contextItems.length * 1), 95),
    memoryGrowth: Math.min(totalItems * 0.8, 25),
    lastUpdated: new Date().toISOString()
  };
}

function extractThemesFromContent(documents: any[], blocks: any[], contextItems: any[]): string[] {
  const themes = new Set<string>();
  
  // Extract from document titles and content keywords
  documents.forEach(doc => {
    if (doc.title) {
      const titleWords = doc.title.toLowerCase()
        .split(/[\s\-_]+/)
        .filter((word: string) => word.length > 3 && !isCommonWord(word));
      titleWords.forEach((word: string) => themes.add(capitalizeWord(word)));
    }
    
    // Extract meaningful keywords from content
    if (doc.content_raw) {
      const contentWords = extractKeywords(doc.content_raw);
      contentWords.forEach((word: string) => themes.add(word));
    }
  });
  
  // Extract from block semantic types and content
  blocks.forEach(block => {
    if (block.semantic_type) {
      themes.add(capitalizeWord(block.semantic_type.replace(/_/g, ' ')));
    }
    if (block.canonical_value) {
      themes.add(capitalizeWord(block.canonical_value));
    }
    if (block.content) {
      const contentWords = extractKeywords(block.content);
      contentWords.forEach((word: string) => themes.add(word));
    }
  });
  
  // Extract from context items
  contextItems.forEach(item => {
    if (item.content) {
      const contentWords = extractKeywords(item.content);
      contentWords.forEach((word: string) => themes.add(word));
    }
  });
  
  return Array.from(themes).slice(0, 8);
}

function identifyPatterns(documents: any[], blocks: any[], contextItems: any[]): string[] {
  const patterns = [];
  
  // Check document patterns
  const docTitles = documents.map(d => d.title?.toLowerCase() || '').join(' ');
  if (docTitles.includes('strategy') || docTitles.includes('plan')) {
    patterns.push('strategic planning');
  }
  if (docTitles.includes('technical') || docTitles.includes('implementation') || docTitles.includes('architecture')) {
    patterns.push('technical implementation');
  }
  if (docTitles.includes('user') || docTitles.includes('ux') || docTitles.includes('interface')) {
    patterns.push('user experience');
  }
  if (docTitles.includes('analysis') || docTitles.includes('research')) {
    patterns.push('analytical thinking');
  }
  
  // Check block patterns
  const blockTypes = blocks.map(b => b.semantic_type?.toLowerCase() || '').join(' ');
  if (blockTypes.includes('user') || blockTypes.includes('persona')) {
    patterns.push('user-centered design');
  }
  if (blockTypes.includes('requirement') || blockTypes.includes('feature')) {
    patterns.push('requirement analysis');
  }
  
  return patterns.length > 0 ? patterns : ['project development'];
}

function extractKeywords(text: string, limit: number = 3): string[] {
  if (!text) return [];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word: string) => word.length > 4 && !isCommonWord(word));
    
  // Simple frequency analysis
  const wordCount = new Map<string, number>();
  words.forEach((word: string) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => capitalizeWord(word));
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'have', 'this', 'that', 'with', 'they', 'from', 'will', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'what', 'about', 'when', 'where', 'some', 'more', 'very', 'into', 'after', 'first', 'well', 'work', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
  ]);
  return commonWords.has(word.toLowerCase());
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}