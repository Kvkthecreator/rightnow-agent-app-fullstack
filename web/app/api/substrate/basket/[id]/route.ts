import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: basketId } = await params;
    const supabase = createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access required' }, { status: 403 });
    }

    // Fetch data directly from Supabase
    const [basketResult, documentsResult] = await Promise.all([
      supabase
        .from('baskets')
        .select('*')
        .eq('id', basketId)
        .eq('workspace_id', workspace.id)
        .single(),
      supabase
        .from('documents')
        .select('*')
        .eq('basket_id', basketId)
        .eq('workspace_id', workspace.id)
    ]);

    if (basketResult.error || !basketResult.data) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // For intelligence data, make an internal request using absolute URL
    let intelligenceData = { themes: [], insights: [], recommendations: [] };
    try {
      const baseUrl = new URL(request.url).origin;
      const intelligenceResponse = await fetch(
        `${baseUrl}/api/intelligence/basket/${basketId}/dashboard`,
        {
          headers: {
            'Authorization': request.headers.get('authorization') || '',
            'Cookie': request.headers.get('cookie') || '',
          }
        }
      );

      if (intelligenceResponse.ok) {
        intelligenceData = await intelligenceResponse.json();
      }
    } catch (error) {
      console.warn('Intelligence API unavailable, using defaults:', error);
    }

    // Transform data to substrate format
    const substrateIntelligence = transformToSubstrateFormat(
      basketResult.data,
      documentsResult.data || [],
      intelligenceData
    );

    return NextResponse.json(substrateIntelligence);

  } catch (error) {
    console.error('Substrate intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to generate substrate intelligence' },
      { status: 500 }
    );
  }
}

function transformToSubstrateFormat(basketData: any, documentsData: any[], intelligenceData: any): SubstrateIntelligence {
  // Calculate total content to determine if we have enough for meaningful analysis
  const totalContentLength = documentsData.reduce((sum, doc) => 
    sum + (doc.content_raw?.length || 0), 0
  );

  // Return honest "insufficient content" response for minimal content
  if (totalContentLength < 100) {
    return {
      basketInfo: {
        id: basketData.id,
        name: basketData.name || 'Untitled Workspace',
        status: mapBasketStatus(basketData.status),
        lastUpdated: basketData.updated_at || basketData.created_at || new Date().toISOString(),
        documentCount: documentsData.length,
        workspaceId: basketData.workspace_id
      },
      contextUnderstanding: {
        intent: `You currently have ${totalContentLength} characters of content. Add at least ${100 - totalContentLength} more characters to start generating insights.`,
        themes: [],
        coherenceScore: 0.1,
        lastAnalysis: new Date().toISOString()
      },
      documents: transformDocumentsToSubstrateStatus(documentsData, intelligenceData),
      intelligence: {
        insights: [],
        recommendations: [{
          id: 'add-content',
          priority: 'high',
          title: 'Add content to enable intelligence',
          description: `Your workspace needs more content to generate meaningful insights. Add strategic documents, notes, or uploads to begin analysis.`,
          reasoning: 'Insufficient content for analysis',
          actions: [
            { type: 'add_content', label: 'Add Content' }
          ],
          estimatedImpact: 'high'
        }],
        contextAlerts: [],
        recentActivity: generateRecentActivity(basketData, documentsData)
      },
      substrateHealth: {
        contextQuality: Math.max(0.1, totalContentLength / 1000), // Realistic based on content
        documentAlignment: 0.0,
        evolutionRate: 'stable'
      }
    };
  }

  // Normal processing for baskets with sufficient content
  return {
    basketInfo: {
      id: basketData.id,
      name: basketData.name || 'Untitled Workspace',
      status: mapBasketStatus(basketData.status),
      lastUpdated: basketData.updated_at || basketData.created_at || new Date().toISOString(),
      documentCount: documentsData.length,
      workspaceId: basketData.workspace_id
    },
    contextUnderstanding: {
      intent: extractIntentFromIntelligence(intelligenceData, documentsData),
      themes: extractThemesFromIntelligence(intelligenceData),
      coherenceScore: calculateCoherenceScore(intelligenceData, documentsData),
      lastAnalysis: new Date().toISOString()
    },
    documents: transformDocumentsToSubstrateStatus(documentsData, intelligenceData),
    intelligence: {
      insights: transformToSubstrateInsights(intelligenceData, documentsData),
      recommendations: transformToSubstrateRecommendations(intelligenceData, documentsData),
      contextAlerts: generateContextAlerts(documentsData, intelligenceData),
      recentActivity: generateRecentActivity(basketData, documentsData)
    },
    substrateHealth: {
      contextQuality: calculateContextQuality(intelligenceData, documentsData),
      documentAlignment: calculateDocumentAlignment(documentsData, intelligenceData),
      evolutionRate: determineEvolutionRate(basketData, documentsData)
    }
  };
}

function mapBasketStatus(status: string): 'active' | 'archived' | 'draft' {
  switch (status?.toLowerCase()) {
    case 'active': return 'active';
    case 'archived': return 'archived';
    case 'draft': case 'init': return 'draft';
    default: return 'active';
  }
}

function extractIntentFromIntelligence(intelligence: any, documentsData: any[] = []): string {
  if (intelligence.understanding) {
    return intelligence.understanding;
  }
  if (intelligence.project_understanding?.intent) {
    return intelligence.project_understanding.intent;
  }
  
  // Check if we have real themes and content
  const realThemes = extractThemesFromIntelligence(intelligence);
  const totalContentLength = documentsData.reduce((sum, doc) => 
    sum + (doc.content_raw?.length || 0), 0
  );
  
  if (totalContentLength < 100 && realThemes.length === 0) {
    return "Add more strategic content to help me understand your intent";
  }
  
  if (realThemes.length === 1) {
    return `Building understanding around ${realThemes[0].toLowerCase()}. Add more strategic context for deeper insights.`;
  }
  
  if (realThemes.length > 1) {
    return `Building understanding around ${realThemes.slice(0, 2).join(' and ').toLowerCase()}`;
  }
  
  return "Add strategic documents, plans, or context to enable intelligent analysis";
}

function extractThemesFromIntelligence(intelligence: any): string[] {
  const themes = [];
  
  if (intelligence.themes) {
    themes.push(...intelligence.themes);
  }
  
  if (intelligence.project_understanding?.themes) {
    themes.push(...intelligence.project_understanding.themes);
  }
  
  // Don't add fake themes - return empty array if no real themes detected
  return themes.slice(0, 5);
}

function transformDocumentsToSubstrateStatus(documents: any[], intelligence: any): any[] {
  return documents.map(doc => {
    const status = determineDocumentStatus(doc, intelligence);
    const alignment = calculateDocumentAlignment([doc], intelligence);
    
    return {
      id: doc.id,
      title: doc.title,
      type: doc.document_type || 'general',
      status,
      contextAlignment: alignment,
      lastEvolution: doc.updated_at || doc.created_at,
      impactSummary: generateDocumentImpactSummary(doc, status),
      actions: generateDocumentActions(doc, status)
    };
  });
}

function determineDocumentStatus(doc: any, intelligence: any): string {
  const hasRecentUpdates = new Date(doc.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hasHighAlignment = doc.metadata?.alignment_score > 0.8;
  
  if (hasRecentUpdates) return 'growing';
  if (hasHighAlignment) return 'stable';
  if (doc.metadata?.needs_review) return 'review_needed';
  
  return 'stable';
}

function generateDocumentImpactSummary(doc: any, status: string): string {
  switch (status) {
    case 'stable':
      return `Reflects your core ${doc.document_type || 'business'} understanding`;
    case 'growing':
      return `Integrating new ${doc.document_type || 'strategic'} insights`;
    case 'review_needed':
      return `Recent context changes may affect your ${doc.document_type || 'current'} approach`;
    default:
      return `Ready to enhance your ${doc.document_type || 'strategic'} context`;
  }
}

function generateDocumentActions(doc: any, status: string): any[] {
  const baseActions = [
    { type: 'view', label: 'View' },
    { type: 'edit', label: 'Edit' }
  ];
  
  switch (status) {
    case 'review_needed':
      return [
        { type: 'review', label: 'Review' },
        { type: 'lock', label: 'Lock' },
        ...baseActions
      ];
    case 'growing':
      return [
        { type: 'review', label: 'Review' },
        { type: 'help', label: 'Help' },
        ...baseActions
      ];
    default:
      return baseActions;
  }
}

function transformToSubstrateInsights(intelligence: any, documentsData: any[] = []): any[] {
  const insights = [];
  
  if (intelligence.insights) {
    insights.push(...intelligence.insights.map((insight: any) => ({
      id: insight.id || Math.random().toString(),
      type: 'pattern_detected',
      title: insight.title || 'Pattern Detected',
      description: insight.description || insight.content || 'New pattern identified in your context',
      confidence: insight.confidence || 0.8,
      affectedDocuments: insight.related_documents || [],
      contextSource: 'Recent content analysis'
    })));
  }
  
  return insights.slice(0, 5);
}

function transformToSubstrateRecommendations(intelligence: any, documentsData: any[] = []): any[] {
  const recommendations = [];
  
  if (intelligence.recommendations) {
    recommendations.push(...intelligence.recommendations.map((rec: any) => ({
      id: rec.id || Math.random().toString(),
      priority: rec.priority || 'medium',
      title: rec.title || 'Strategic Enhancement',
      description: rec.description || rec.content || 'Enhancement opportunity detected',
      reasoning: rec.reasoning || 'Based on your recent context additions',
      actions: [
        { type: 'auto_generate', label: rec.action_label || 'Auto-Generate' },
        { type: 'add_context', label: 'Add More Context' },
        { type: 'learn_more', label: 'Learn More' }
      ],
      estimatedImpact: rec.impact || 'medium'
    })));
  }
  
  return recommendations.slice(0, 3);
}

function generateContextAlerts(documents: any[], intelligence: any): any[] {
  const alerts = [];
  
  if (intelligence.conflicts?.length > 0) {
    alerts.push(...intelligence.conflicts.map((conflict: any) => ({
      id: Math.random().toString(),
      type: 'conflict',
      title: 'Context Conflict Detected',
      description: conflict.description || 'New context conflicts with existing documents',
      severity: 'warning',
      affectedDocuments: conflict.documents || [],
      suggestedActions: ['Review Conflict', 'Update Strategy', 'Keep Separate']
    })));
  }
  
  return alerts.slice(0, 3);
}

function generateRecentActivity(basket: any, documents: any[]): any[] {
  const activities: any[] = [];
  
  documents.forEach(doc => {
    if (new Date(doc.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      activities.push({
        timestamp: doc.updated_at,
        type: 'document_evolved',
        impact: 'medium',
        description: `${doc.title} updated with new context`,
        details: 'Document enhanced with latest insights'
      });
    }
  });
  
  return activities.slice(0, 5).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function calculateContextQuality(intelligence: any, documentsData: any[] = []): number {
  const totalContentLength = documentsData.reduce((sum, doc) => 
    sum + (doc.content_raw?.length || 0), 0
  );
  
  const hasInsights = intelligence.insights?.length > 0;
  const hasRecommendations = intelligence.recommendations?.length > 0;
  const realThemes = extractThemesFromIntelligence(intelligence);
  const hasRealThemes = realThemes.length > 0;
  
  // Start with honest low base score
  let score = 0.1;
  
  // Build up score based on real content
  if (totalContentLength > 100) score += 0.1;
  if (totalContentLength > 500) score += 0.2;
  if (totalContentLength > 1000) score += 0.2;
  if (totalContentLength > 2000) score += 0.1;
  
  // Add points for real intelligence features
  if (hasInsights) score += 0.2;
  if (hasRecommendations) score += 0.1;
  if (hasRealThemes && realThemes.length > 1) score += 0.1;
  if (hasRealThemes && realThemes.length > 2) score += 0.1;
  
  return Math.min(score, 1.0);
}

function calculateCoherenceScore(intelligence: any, documentsData: any[] = []): number {
  const totalContentLength = documentsData.reduce((sum, doc) => 
    sum + (doc.content_raw?.length || 0), 0
  );
  const realThemes = extractThemesFromIntelligence(intelligence);
  
  // Base coherence based on content amount and theme consistency
  if (totalContentLength < 100) return 0.2;
  if (totalContentLength < 500) return 0.4;
  if (realThemes.length === 0) return 0.3;
  if (realThemes.length === 1) return 0.6;
  if (realThemes.length > 1) return 0.8;
  
  return 0.8;
}

function calculateDocumentAlignment(documents: any[], intelligence: any): number {
  if (!documents.length) return 0.0; // No docs = no alignment
  
  // Check for documents with substantial content
  const docsWithContent = documents.filter(doc => 
    doc.content_raw && doc.content_raw.length > 100
  );
  
  if (docsWithContent.length === 0) return 0.0; // No content = no alignment
  
  // For now, calculate based on content presence
  // In the future, this could analyze actual content similarity/coherence
  const contentAlignment = docsWithContent.length / documents.length;
  
  // Bonus for documents that actually have meaningful metadata alignment scores
  const docsWithHighAlignment = documents.filter(doc => 
    doc.metadata?.alignment_score > 0.7
  ).length;
  
  if (docsWithHighAlignment > 0) {
    return Math.min(contentAlignment + (docsWithHighAlignment / documents.length * 0.2), 1.0);
  }
  
  return contentAlignment;
}

function determineEvolutionRate(basket: any, documents: any[]): 'stable' | 'growing' | 'active' {
  const recentUpdates = documents.filter(doc => 
    new Date(doc.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;
  
  if (recentUpdates > 2) return 'active';
  if (recentUpdates > 0) return 'growing';
  return 'stable';
}