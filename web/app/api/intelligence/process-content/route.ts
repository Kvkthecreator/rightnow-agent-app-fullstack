import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface ContentInput {
  type: 'text' | 'file' | 'url';
  content: string;
  metadata?: Record<string, any>;
}

interface ProcessContentRequest {
  inputs: ContentInput[];
  workspace_context?: {
    basket_id?: string;
    existing_themes?: string[];
  };
  processing_intent: 'onboarding' | 'enhancement';
}

interface ExtractedSemantics {
  themes: string[];
  concepts: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'low' | 'medium' | 'high';
}

interface IntelligenceResult {
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
}

interface SuggestedDocument {
  title: string;
  type: string;
  description: string;
  initial_content: string;
  relevance: number;
}

interface BasketStructure {
  suggested_name: string;
  description: string;
  organization_strategy: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
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

    const body: ProcessContentRequest = await request.json();
    const { inputs, workspace_context, processing_intent } = body;

    // Validate inputs
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json(
        { error: "At least one content input is required" },
        { status: 400 }
      );
    }

    // Process content through universal intelligence engine
    const intelligence = await processUniversalContent(inputs, workspace_context);
    
    // Generate basket structure suggestions
    const suggested_structure = await suggestBasketStructure(intelligence, processing_intent);
    
    // Generate processing summary
    const processing_summary = generateProcessingSummary(inputs, intelligence);

    return NextResponse.json({
      intelligence,
      suggested_structure,
      processing_summary,
      processed_at: new Date().toISOString(),
      processing_intent
    });

  } catch (error) {
    console.error("Content processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process content",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function processUniversalContent(
  inputs: ContentInput[],
  workspace_context?: { basket_id?: string; existing_themes?: string[] }
): Promise<IntelligenceResult> {
  // Combine all content for analysis
  const combinedContent = inputs.map(input => input.content).join('\n\n');
  
  // Extract semantic information
  const semantics = extractSemantics(combinedContent);
  
  // Generate themes (merge with existing if provided)
  const discoveredThemes = semantics.themes;
  const existingThemes = workspace_context?.existing_themes || [];
  const themes = [...new Set([...existingThemes, ...discoveredThemes])].slice(0, 8);
  
  // Generate context items
  const context_items = generateContextItems(semantics, inputs);
  
  // Identify patterns
  const patterns = identifyPatterns(semantics, inputs);
  
  // Calculate confidence score
  const confidence_score = calculateConfidenceScore(semantics, inputs);
  
  return {
    themes,
    context_items,
    patterns,
    confidence_score
  };
}

function extractSemantics(content: string): ExtractedSemantics {
  const text = content.toLowerCase();
  
  // Theme extraction using keyword analysis
  const themeKeywords = {
    'product-development': ['product', 'development', 'feature', 'build', 'create', 'design'],
    'business-strategy': ['strategy', 'business', 'market', 'competitive', 'growth', 'revenue'],
    'customer-experience': ['customer', 'user', 'experience', 'satisfaction', 'feedback', 'service'],
    'operations': ['process', 'operations', 'efficiency', 'workflow', 'optimization'],
    'marketing': ['marketing', 'campaign', 'brand', 'promotion', 'advertising', 'reach'],
    'data-analysis': ['data', 'analysis', 'metrics', 'insights', 'reporting', 'analytics'],
    'project-management': ['project', 'timeline', 'milestone', 'planning', 'coordination'],
    'technology': ['technology', 'software', 'platform', 'technical', 'system', 'digital']
  };
  
  const themes: string[] = [];
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const score = keywords.reduce((count, keyword) => {
      return count + (text.split(keyword).length - 1);
    }, 0);
    
    if (score >= 2) { // Threshold for theme detection
      themes.push(theme);
    }
  }
  
  // Extract key concepts and entities
  const concepts = extractConcepts(text);
  const entities = extractEntities(text);
  
  // Determine sentiment
  const sentiment = determineSentiment(text);
  
  // Assess complexity
  const complexity = assessComplexity(content);
  
  return {
    themes: themes.slice(0, 5),
    concepts: concepts.slice(0, 10),
    entities: entities.slice(0, 8),
    sentiment,
    complexity
  };
}

function extractConcepts(text: string): string[] {
  // Extract meaningful multi-word phrases and single important words
  const words = text.split(/\s+/)
    .filter(word => word.length > 4)
    .filter(word => !isStopWord(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 3);
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return most frequent concepts
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function extractEntities(text: string): string[] {
  // Simple entity extraction for organizations, locations, etc.
  const entityPatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Proper nouns (names, places)
    /\b[A-Z]{2,}\b/g, // Acronyms
    /\b\d{4}\b/g, // Years
    /\$\d+/g // Money amounts
  ];
  
  const entities: string[] = [];
  entityPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    entities.push(...matches);
  });
  
  return [...new Set(entities)].slice(0, 8);
}

function determineSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['good', 'great', 'excellent', 'successful', 'achieve', 'improve', 'grow', 'opportunity'];
  const negativeWords = ['problem', 'issue', 'challenge', 'difficult', 'failed', 'concern', 'risk', 'obstacle'];
  
  const positiveCount = positiveWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
  const negativeCount = negativeWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
  
  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}

function assessComplexity(content: string): 'low' | 'medium' | 'high' {
  const sentences = content.split(/[.!?]+/).length;
  const words = content.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Simple complexity assessment
  if (avgWordsPerSentence > 20 || words > 1000) return 'high';
  if (avgWordsPerSentence > 12 || words > 500) return 'medium';
  return 'low';
}

function isStopWord(word: string): boolean {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those'];
  return stopWords.includes(word.toLowerCase());
}

function generateContextItems(
  semantics: ExtractedSemantics,
  inputs: ContentInput[]
): Array<{ type: string; content: string; relevance_score: number }> {
  const items = [];
  
  // Generate context items from key themes
  semantics.themes.forEach((theme, index) => {
    items.push({
      type: 'theme',
      content: theme.replace('-', ' '),
      relevance_score: Math.max(0.9 - (index * 0.1), 0.6)
    });
  });
  
  // Generate context items from key concepts
  semantics.concepts.slice(0, 3).forEach((concept, index) => {
    items.push({
      type: 'concept',
      content: concept,
      relevance_score: Math.max(0.8 - (index * 0.1), 0.5)
    });
  });
  
  // Add input type context
  const inputTypes = [...new Set(inputs.map(input => input.type))];
  if (inputTypes.length > 0) {
    items.push({
      type: 'input_source',
      content: `Content from: ${inputTypes.join(', ')}`,
      relevance_score: 0.7
    });
  }
  
  return items.slice(0, 8);
}

function identifyPatterns(
  semantics: ExtractedSemantics,
  inputs: ContentInput[]
): Array<{ pattern_type: string; description: string; confidence: number }> {
  const patterns = [];
  
  // Content complexity pattern
  patterns.push({
    pattern_type: 'content_complexity',
    description: `Content appears to be ${semantics.complexity} complexity`,
    confidence: 0.8
  });
  
  // Sentiment pattern
  if (semantics.sentiment !== 'neutral') {
    patterns.push({
      pattern_type: 'sentiment_focus',
      description: `Content has a ${semantics.sentiment} orientation`,
      confidence: 0.7
    });
  }
  
  // Multi-input pattern
  if (inputs.length > 1) {
    patterns.push({
      pattern_type: 'multi_source',
      description: `Information from ${inputs.length} different sources suggests comprehensive planning`,
      confidence: 0.8
    });
  }
  
  // Theme density pattern
  if (semantics.themes.length > 3) {
    patterns.push({
      pattern_type: 'theme_rich',
      description: `Multiple themes indicate cross-functional basket scope`,
      confidence: 0.7
    });
  }
  
  return patterns;
}

function calculateConfidenceScore(
  semantics: ExtractedSemantics,
  inputs: ContentInput[]
): number {
  let score = 0.5; // Base confidence
  
  // More themes = higher confidence
  score += Math.min(semantics.themes.length * 0.1, 0.3);
  
  // More inputs = higher confidence
  score += Math.min(inputs.length * 0.05, 0.2);
  
  // Content length affects confidence
  const totalLength = inputs.reduce((sum, input) => sum + input.content.length, 0);
  if (totalLength > 500) score += 0.1;
  if (totalLength > 1000) score += 0.1;
  
  // Concepts and entities add confidence
  score += Math.min(semantics.concepts.length * 0.02, 0.1);
  score += Math.min(semantics.entities.length * 0.02, 0.1);
  
  return Math.min(score, 0.95); // Cap at 95%
}

async function suggestBasketStructure(
  intelligence: IntelligenceResult,
  processing_intent: string
): Promise<{
  documents: SuggestedDocument[];
  organization: BasketStructure;
}> {
  const primaryThemes = intelligence.themes.slice(0, 3);
  
  // Generate document suggestions based on themes
  const documents: SuggestedDocument[] = [];
  
  primaryThemes.forEach((theme, index) => {
    const themeWords = theme.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    documents.push({
      title: `${themeWords} Overview`,
      type: 'strategy',
      description: `Strategic overview and analysis for ${themeWords.toLowerCase()}`,
      initial_content: `# ${themeWords} Overview\n\nThis document captures the strategic approach and key considerations for ${themeWords.toLowerCase()}.\n\n## Key Focus Areas\n\n${intelligence.context_items
        .filter(item => item.type === 'theme' || item.type === 'concept')
        .slice(0, 3)
        .map(item => `- ${item.content}`)
        .join('\n')}\n\n## Next Steps\n\n- Define specific objectives\n- Identify key stakeholders\n- Establish success metrics`,
      relevance: Math.max(0.9 - (index * 0.1), 0.7)
    });
  });
  
  // Add a general planning document if we have good patterns
  if (intelligence.patterns.length > 2) {
    documents.push({
      title: 'Implementation Plan',
      type: 'planning',
      description: 'Comprehensive implementation strategy and timeline',
      initial_content: `# Implementation Plan\n\n## Overview\n\nBased on the content analysis, this implementation plan addresses the key themes and patterns identified.\n\n## Key Patterns Identified\n\n${intelligence.patterns
        .slice(0, 3)
        .map(pattern => `- **${pattern.pattern_type}**: ${pattern.description}`)
        .join('\n')}\n\n## Implementation Strategy\n\n1. **Phase 1**: Foundation and Planning\n2. **Phase 2**: Core Implementation\n3. **Phase 3**: Optimization and Scale\n\n## Success Metrics\n\n- Define specific KPIs based on identified themes\n- Regular progress reviews\n- Stakeholder feedback loops`,
      relevance: 0.8
    });
  }
  
  // Generate basket organization
  const organization: BasketStructure = {
    suggested_name: generateBasketName(intelligence.themes),
    description: `Basket focused on ${primaryThemes.join(', ').replace(/-/g, ' ')}`,
    organization_strategy: intelligence.confidence_score > 0.7
      ? 'theme-based'
      : 'exploratory'
  };
  
  return {
    documents: documents.slice(0, 4), // Limit to 4 documents
    organization
  };
}

function generateBasketName(themes: string[]): string {
  if (themes.length === 0) return 'New Basket';

  const primaryTheme = themes[0].split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${primaryTheme} Basket`;
}

function generateProcessingSummary(
  inputs: ContentInput[],
  intelligence: IntelligenceResult
): string {
  const inputSummary = inputs.length === 1 
    ? `Analyzed ${inputs[0].type} input`
    : `Analyzed ${inputs.length} inputs (${inputs.map(i => i.type).join(', ')})`;
  
  const themeSummary = intelligence.themes.length > 0
    ? `Identified ${intelligence.themes.length} key themes: ${intelligence.themes.slice(0, 3).join(', ')}`
    : 'Analyzing content for themes and patterns';
    
  const confidenceSummary = `Analysis confidence: ${Math.round(intelligence.confidence_score * 100)}%`;
  
  return `${inputSummary}. ${themeSummary}. ${confidenceSummary}`;
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}