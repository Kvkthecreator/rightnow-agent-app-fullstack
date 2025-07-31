/**
 * Narrative API: Project Understanding
 * 
 * This endpoint provides user-facing project understanding through the narrative agent layer.
 * It transforms technical analysis into human-centered insights and explanations.
 * 
 * CRITICAL: This API must NEVER expose technical substrate vocabulary.
 * All responses are crafted for user consumption with narrative language.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AgentCoordinator, NarrativeRequestBuilder } from '@/lib/coordination/AgentCoordinator';

export async function GET(
  request: NextRequest,
  { params }: { params: { basketId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const basketId = params.basketId;
    const searchParams = request.nextUrl.searchParams;
    
    // Extract user context from query parameters
    const userName = searchParams.get('userName') || undefined;
    const projectType = searchParams.get('projectType') || undefined;
    const includProgress = searchParams.get('includeProgress') === 'true';
    const includeInsights = searchParams.get('includeInsights') === 'true';

    // Verify user has access to this basket
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id')
      .eq('id', basketId)
      .eq('user_id', user.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Create agent coordinator and process narrative understanding request
    const coordinator = new AgentCoordinator(supabase);
    
    const narrativeRequest = {
      basketId,
      requestType: 'understanding' as const,
      context: {
        userContext: { 
          name: userName, 
          projectType: projectType || 'project' 
        }
      },
      options: {
        includeInsights,
        includeProgress: includProgress,
        cacheResults: true,
        analysisDepth: 'standard' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    // Return user-friendly narrative response
    return NextResponse.json({
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Core narrative understanding
      understanding: {
        greeting: response.projectUnderstanding.personalizedGreeting,
        currentUnderstanding: response.projectUnderstanding.currentUnderstanding,
        intelligenceLevel: {
          stage: response.projectUnderstanding.intelligenceLevel.stage,
          description: response.projectUnderstanding.intelligenceLevel.description,
          progressIndicator: response.projectUnderstanding.intelligenceLevel.progressIndicator,
          capabilities: response.projectUnderstanding.intelligenceLevel.capabilities
        },
        confidence: {
          level: response.projectUnderstanding.confidence.level,
          explanation: response.projectUnderstanding.confidence.explanation,
          visualDescription: response.projectUnderstanding.confidence.visualDescription
        }
      },

      // Discovered themes (narrative format)
      themes: response.projectUnderstanding.discoveredThemes.map(theme => ({
        name: theme.name,
        description: theme.description,
        relevance: theme.relevance,
        explanation: theme.userFriendlyExplanation
      })),

      // Next steps (user-friendly actions)
      nextSteps: response.projectUnderstanding.nextSteps,
      recommendedActions: response.recommendedActions,

      // Optional insights (if requested)
      ...(response.insights && {
        insights: response.insights.map(insight => ({
          insight: insight.insight,
          supportingEvidence: insight.supportingEvidence,
          actionableAdvice: insight.actionableAdvice,
          relatedThemes: insight.relatedThemes
        }))
      }),

      // Optional learning progress (if requested)
      ...(response.learningProgress && {
        learningProgress: {
          currentStage: response.learningProgress.currentStage,
          progressDescription: response.learningProgress.progressDescription,
          recentDiscoveries: response.learningProgress.recentDiscoveries,
          nextLearningOpportunities: response.learningProgress.nextLearningOpportunities,
          memoryGrowth: response.learningProgress.memoryGrowth
        }
      }),

      // Response metadata (user-friendly)
      metadata: {
        processingTime: `${response.processingTime}ms`,
        intelligenceLevel: response.intelligenceLevel,
        responseType: 'project_understanding',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Narrative understanding API error:', error);
    
    // Return user-friendly error response
    return NextResponse.json({
      success: false,
      error: 'I had trouble understanding your project right now. Please try again in a moment.',
      fallbackMessage: "I'm ready to learn about your project when you share more content with me.",
      suggestedActions: [
        "Try refreshing the page",
        "Add more content to help me understand better",
        "Check your internet connection"
      ]
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { basketId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const basketId = params.basketId;
    const body = await request.json();
    
    // Extract request parameters
    const {
      userContext,
      options = {},
      refreshCache = false
    } = body;

    // Verify user has access to this basket
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id')
      .eq('id', basketId)
      .eq('user_id', user.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Create agent coordinator
    const coordinator = new AgentCoordinator(supabase);
    
    // Clear cache if requested
    if (refreshCache) {
      coordinator.resetCoordination();
    }

    const narrativeRequest = {
      basketId,
      requestType: 'understanding' as const,
      context: { userContext },
      options: {
        includeInsights: options.includeInsights ?? true,
        includeProgress: options.includeProgress ?? false,
        cacheResults: !refreshCache,
        analysisDepth: options.analysisDepth || 'standard' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    // Return comprehensive narrative understanding
    return NextResponse.json({
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Complete understanding response
      understanding: response.projectUnderstanding,
      
      // Additional response elements
      ...(response.insights && { insights: response.insights }),
      ...(response.learningProgress && { learningProgress: response.learningProgress }),
      
      // Processing metadata
      metadata: {
        processingTime: `${response.processingTime}ms`,
        intelligenceLevel: response.intelligenceLevel,
        responseType: 'comprehensive_understanding',
        requestId: response.requestId,
        timestamp: new Date().toISOString(),
        cacheRefreshed: refreshCache
      }
    });

  } catch (error) {
    console.error('Narrative understanding POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'I encountered an issue processing your understanding request.',
      fallbackMessage: "Please try again, or add more content to help me understand your project better.",
      suggestedActions: [
        "Try the request again",
        "Add more content to your project",
        "Check that your project has sufficient material for analysis"
      ]
    }, { status: 500 });
  }
}