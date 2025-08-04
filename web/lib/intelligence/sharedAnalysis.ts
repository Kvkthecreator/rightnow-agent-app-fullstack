// Shared intelligence analysis logic to avoid API-to-API calls
import type { SupabaseClient } from '@supabase/supabase-js';

export interface BasketIntelligenceData {
  understanding: string;
  themes: string[];
  nextSteps: Array<{ description: string; priority: number }>;
  actions: Array<{ type: string; label: string; enabled: boolean; primary?: boolean }>;
  confidenceScore: number;
  memoryGrowth: number;
  lastUpdated: string;
  insights?: any[];
  recommendations?: any[];
}

export async function analyzeBasketIntelligence(
  supabase: SupabaseClient,
  basketId: string,
  workspaceId: string
): Promise<BasketIntelligenceData | null> {
  try {
    console.log(`[SharedAnalysis] Fetching basket ${basketId} for workspace ${workspaceId}`);
    
    // First, try to get just the basket to ensure it exists
    const { data: basketData, error: basketError } = await supabase
      .from("baskets")
      .select("*")
      .eq("id", basketId)
      .eq("workspace_id", workspaceId)
      .single();

    if (basketError) {
      console.error(`[SharedAnalysis] Basket query error:`, basketError);
      return null;
    }

    if (!basketData) {
      console.warn(`[SharedAnalysis] Basket ${basketId} not found`);
      return null;
    }

    console.log(`[SharedAnalysis] Found basket: ${basketData.name}`);

    // Now fetch related data separately for better error handling
    const [documentsResult, blocksResult, contextResult] = await Promise.all([
      supabase
        .from("documents")
        .select("id, title, content_raw, created_at")
        .eq("basket_id", basketId)
        .eq("workspace_id", workspaceId),
      supabase
        .from("blocks")
        .select("id, semantic_type, content, canonical_value, created_at")
        .eq("basket_id", basketId)
        .eq("workspace_id", workspaceId),
      supabase
        .from("context_items")
        .select("id, type, content, created_at")
        .eq("basket_id", basketId)
        .eq("workspace_id", workspaceId)
    ]);

    // Combine the data
    const basket = {
      ...basketData,
      documents: documentsResult.data || [],
      blocks: blocksResult.data || [],
      context_items: contextResult.data || []
    };

    console.log(`[SharedAnalysis] Analysis data: ${basket.documents.length} docs, ${basket.blocks.length} blocks, ${basket.context_items.length} context items`);

    return analyzeBasketContent(basket);
  } catch (error) {
    console.error('[SharedAnalysis] Unexpected error:', error);
    return null;
  }
}

function analyzeBasketContent(basket: any): BasketIntelligenceData {
  const documents = basket.documents || [];
  const blocks = basket.blocks || [];
  const contextItems = basket.context_items || [];
  
  // Determine basket state based on real content
  const isEmpty = documents.length === 0 && blocks.length === 0 && contextItems.length === 0;
  const isMinimal = documents.length <= 2 && blocks.length <= 5;
  const isRich = documents.length > 5 || blocks.length > 15;

  if (isEmpty) {
    return generateEmptyStateIntelligence(basket);
  } else if (isMinimal) {
    return generateMinimalStateIntelligence(basket, documents, blocks, contextItems);
  } else {
    return generateRichStateIntelligence(basket, documents, blocks, contextItems);
  }
}

function generateEmptyStateIntelligence(basket: any): BasketIntelligenceData {
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
    lastUpdated: new Date().toISOString(),
    insights: [],
    recommendations: [{
      id: 'add-content',
      priority: 'high',
      title: 'Add content to enable intelligence',
      description: `Your workspace needs content to generate meaningful insights. Add strategic documents, notes, or uploads to begin analysis.`,
      reasoning: 'Insufficient content for analysis'
    }]
  };
}

function generateMinimalStateIntelligence(basket: any, documents: any[], blocks: any[], contextItems: any[]): BasketIntelligenceData {
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
    lastUpdated: new Date().toISOString(),
    insights: generateBasicInsights(themes, documents),
    recommendations: generateBasicRecommendations(themes, totalItems)
  };
}

function generateRichStateIntelligence(basket: any, documents: any[], blocks: any[], contextItems: any[]): BasketIntelligenceData {
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
    lastUpdated: new Date().toISOString(),
    insights: generateAdvancedInsights(themes, patterns, documents),
    recommendations: generateAdvancedRecommendations(themes, patterns, totalItems)
  };
}

function generateBasicInsights(themes: string[], documents: any[]): any[] {
  return themes.slice(0, 3).map((theme, index) => ({
    id: `insight-${index}`,
    type: 'pattern_detected',
    title: `${theme} Pattern Detected`,
    description: `Early patterns emerging around ${theme.toLowerCase()}`,
    confidence: 0.6 + (index * 0.1)
  }));
}

function generateAdvancedInsights(themes: string[], patterns: string[], documents: any[]): any[] {
  const insights = themes.slice(0, 5).map((theme, index) => ({
    id: `insight-${index}`,
    type: 'pattern_detected',  
    title: `${theme} Analysis`,
    description: `Strong patterns identified in ${theme.toLowerCase()} with ${documents.length} supporting documents`,
    confidence: 0.8 + (index * 0.05)
  }));

  patterns.forEach((pattern, index) => {
    insights.push({
      id: `pattern-${index}`,
      type: 'strategic_pattern',
      title: `${pattern} Strategy`,
      description: `Strategic pattern detected in ${pattern}`,
      confidence: 0.85
    });
  });

  return insights.slice(0, 5);
}

function generateBasicRecommendations(themes: string[], totalItems: number): any[] {
  const recommendations = [];
  
  if (themes.length > 0) {
    recommendations.push({
      id: 'expand-theme',
      priority: 'medium',
      title: `Expand on ${themes[0]}`,
      description: `Add more content around ${themes[0].toLowerCase()} to deepen understanding`,
      reasoning: 'Theme shows potential for deeper analysis'
    });
  }
  
  if (totalItems < 10) {
    recommendations.push({
      id: 'add-content',
      priority: 'high', 
      title: 'Add more content',
      description: 'Add more documents or context to enable advanced insights',
      reasoning: 'More content needed for comprehensive analysis'
    });
  }
  
  return recommendations;
}

function generateAdvancedRecommendations(themes: string[], patterns: string[], totalItems: number): any[] {
  const recommendations = [];
  
  if (themes.length > 2) {
    recommendations.push({
      id: 'synthesize-themes',
      priority: 'high',
      title: 'Create synthesis document',
      description: `Synthesize insights across ${themes.slice(0, 3).join(', ')} themes`,
      reasoning: 'Multiple themes ready for strategic synthesis'
    });
  }
  
  if (patterns.length > 0) {
    recommendations.push({
      id: 'strategic-planning',
      priority: 'medium',
      title: 'Strategic planning session',
      description: `Plan next steps based on ${patterns[0]} patterns`,
      reasoning: 'Patterns suggest strategic planning opportunity'
    });
  }
  
  return recommendations.slice(0, 3);
}

// Utility functions (extracted from dashboard API)
function extractThemesFromContent(documents: any[], blocks: any[], contextItems: any[]): string[] {
  const themes = new Set<string>();
  
  documents.forEach(doc => {
    if (doc.title) {
      const titleWords = doc.title.toLowerCase()
        .split(/[\s\-_]+/)
        .filter((word: string) => word.length > 3 && !isCommonWord(word));
      titleWords.forEach((word: string) => themes.add(capitalizeWord(word)));
    }
    
    if (doc.content_raw) {
      const contentWords = extractKeywords(doc.content_raw);
      contentWords.forEach((word: string) => themes.add(word));
    }
  });
  
  blocks.forEach(block => {
    if (block.semantic_type) {
      themes.add(capitalizeWord(block.semantic_type.replace(/_/g, ' ')));
    }
    if (block.canonical_value) {
      themes.add(capitalizeWord(block.canonical_value));
    }
  });
  
  return Array.from(themes).slice(0, 8);
}

function identifyPatterns(documents: any[], blocks: any[], contextItems: any[]): string[] {
  const patterns = [];
  
  const docTitles = documents.map(d => d.title?.toLowerCase() || '').join(' ');
  if (docTitles.includes('strategy') || docTitles.includes('plan')) {
    patterns.push('strategic planning');
  }
  if (docTitles.includes('technical') || docTitles.includes('implementation')) {
    patterns.push('technical implementation');
  }
  if (docTitles.includes('user') || docTitles.includes('ux')) {
    patterns.push('user experience');
  }
  
  return patterns.length > 0 ? patterns : ['project development'];
}

function extractKeywords(text: string, limit: number = 3): string[] {
  if (!text) return [];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word: string) => word.length > 4 && !isCommonWord(word));
    
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
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'have', 'this', 'that', 'with', 'they', 'from', 'will', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'what', 'about', 'when', 'where', 'some', 'more', 'very', 'into', 'after', 'first', 'well', 'work', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most'
  ]);
  return commonWords.has(word.toLowerCase());
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}