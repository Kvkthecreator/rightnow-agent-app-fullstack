/**
 * Narrative API: Intelligent Guidance
 * 
 * This endpoint provides strategic and tactical guidance through the narrative agent layer.
 * It transforms technical analysis into actionable, user-friendly recommendations.
 * 
 * CRITICAL: This API must NEVER expose technical substrate vocabulary.
 * All responses are strategic guidance in human-centered language.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AgentCoordinator } from '@/lib/coordination/AgentCoordinator';

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
    
    // Extract guidance parameters
    const focusArea = searchParams.get('focusArea') || undefined;
    const userGoal = searchParams.get('userGoal') as 'explore' | 'develop' | 'organize' | 'complete' | undefined;
    const includeHealthAssessment = searchParams.get('includeHealth') === 'true';
    const includeCreativeOpportunities = searchParams.get('includeCreative') === 'true';

    // Verify user has access to this basket
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id')
      .eq('id', basketId)
      .eq('user_id', user.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Create agent coordinator and process guidance request
    const coordinator = new AgentCoordinator(supabase);
    
    const narrativeRequest = {
      basketId,
      requestType: 'guidance' as const,
      context: {
        focusArea,
        userGoal
      },
      options: {
        includeInsights: true,
        cacheResults: true,
        analysisDepth: 'comprehensive' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    if (!response.strategicGuidance) {
      throw new Error('No strategic guidance generated');
    }

    // Prepare guidance response
    const guidanceResponse: any = {
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Strategic guidance (main response)
      guidance: response.strategicGuidance.map(guidance => ({
        title: guidance.title,
        description: guidance.description,
        recommendation: guidance.recommendation,
        reasoning: guidance.reasoning,
        
        // Action plan with user benefits
        actionPlan: guidance.actionPlan.map(step => ({
          step: step.step,
          description: step.description,
          userBenefit: step.userBenefit,
          estimatedTime: step.estimatedTime,
          prerequisite: step.prerequisite
        })),
        
        expectedOutcome: guidance.expectedOutcome,
        timeframe: guidance.timeframe,
        difficulty: guidance.difficulty
      })),

      // Project context for guidance
      projectContext: {
        currentUnderstanding: response.projectUnderstanding.currentUnderstanding,
        intelligenceLevel: response.projectUnderstanding.intelligenceLevel.stage,
        confidenceLevel: response.projectUnderstanding.confidence.level,
        discoveredThemes: response.projectUnderstanding.discoveredThemes.length,
        nextSteps: response.projectUnderstanding.nextSteps
      },

      // Immediate recommendations
      immediateActions: response.recommendedActions,
      
      metadata: {
        processingTime: `${response.processingTime}ms`,
        focusArea: focusArea || 'comprehensive',
        userGoal: userGoal || 'general_improvement',
        guidanceLevel: response.intelligenceLevel,
        timestamp: new Date().toISOString()
      }
    };

    // Add optional assessments if requested
    if (includeHealthAssessment) {
      const healthRequest = {
        basketId,
        requestType: 'health_assessment' as const,
        options: { cacheResults: true }
      };
      
      const healthResponse = await coordinator.processNarrativeIntelligence(healthRequest);
      
      if (healthResponse.healthAssessment) {
        guidanceResponse.healthAssessment = {
          overallHealth: healthResponse.healthAssessment.overallHealth,
          strengths: healthResponse.healthAssessment.strengths,
          improvementAreas: healthResponse.healthAssessment.improvementAreas,
          recommendations: healthResponse.healthAssessment.recommendations.map(rec => ({
            focus: rec.focus,
            suggestion: rec.suggestion,
            impact: rec.impact,
            effort: rec.effort
          })),
          progressTrajectory: healthResponse.healthAssessment.progressTrajectory
        };
      }
    }

    if (includeCreativeOpportunities) {
      const creativeRequest = {
        basketId,
        requestType: 'creative_exploration' as const,
        options: { cacheResults: true }
      };
      
      const creativeResponse = await coordinator.processNarrativeIntelligence(creativeRequest);
      
      if (creativeResponse.creativeOpportunities) {
        guidanceResponse.creativeOpportunities = creativeResponse.creativeOpportunities.map(opp => ({
          opportunity: opp.opportunity,
          description: opp.description,
          inspirationalPrompt: opp.inspirationalPrompt,
          explorationSteps: opp.explorationSteps,
          potentialOutcomes: opp.potentialOutcomes
        }));
      }
    }

    return NextResponse.json(guidanceResponse);

  } catch (error) {
    console.error('Guidance API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'I had trouble generating guidance for your project right now.',
      fallbackGuidance: [
        {
          title: "Continue Building Your Project",
          description: "Keep adding content and developing your ideas",
          recommendation: "Add more material to help me provide better guidance",
          reasoning: "More content enables more sophisticated guidance and insights",
          actionPlan: [
            {
              step: "Add more content",
              description: "Share additional documents, ideas, or materials",
              userBenefit: "Enable better analysis and guidance",
              estimatedTime: "15-30 minutes"
            }
          ],
          expectedOutcome: "Improved ability to provide strategic guidance",
          timeframe: 'immediate',
          difficulty: 'beginner_friendly'
        }
      ],
      suggestion: "Try adding more content to your project, then request guidance again."
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
    
    // Extract comprehensive guidance request parameters
    const {
      focusArea,
      userGoal,
      specificQuestion,
      requestedAnalysis = [],
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
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Create agent coordinator
    const coordinator = new AgentCoordinator(supabase);
    
    // Clear cache if requested
    if (refreshCache) {
      coordinator.resetCoordination();
    }

    // Main guidance request
    const narrativeRequest = {
      basketId,
      requestType: 'guidance' as const,
      context: {
        focusArea,
        userGoal,
        userQuery: specificQuestion
      },
      options: {
        includeInsights: true,
        includeProgress: true,
        cacheResults: !refreshCache,
        analysisDepth: 'comprehensive' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    // Prepare comprehensive guidance response
    const comprehensiveResponse: any = {
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Main strategic guidance
      strategicGuidance: response.strategicGuidance || [],
      
      // Project understanding and context
      projectUnderstanding: {
        greeting: response.projectUnderstanding.personalizedGreeting,
        currentUnderstanding: response.projectUnderstanding.currentUnderstanding,
        intelligenceLevel: response.projectUnderstanding.intelligenceLevel,
        confidence: response.projectUnderstanding.confidence,
        themes: response.projectUnderstanding.discoveredThemes,
        nextSteps: response.projectUnderstanding.nextSteps
      },

      // Enhanced analysis based on requested types
      analysis: {},

      metadata: {
        processingTime: `${response.processingTime}ms`,
        requestId: response.requestId,
        analysisDepth: 'comprehensive',
        focusArea: focusArea || 'all_areas',
        userGoal: userGoal || 'general_improvement',
        cacheRefreshed: refreshCache,
        timestamp: new Date().toISOString()
      }
    };

    // Add requested analysis types
    const analysisPromises: Promise<any>[] = [];

    if (requestedAnalysis.includes('health_assessment')) {
      analysisPromises.push(
        coordinator.processNarrativeIntelligence({
          basketId,
          requestType: 'health_assessment',
          options: { cacheResults: !refreshCache }
        })
      );
    }

    if (requestedAnalysis.includes('creative_opportunities')) {
      analysisPromises.push(
        coordinator.processNarrativeIntelligence({
          basketId,
          requestType: 'creative_exploration',
          options: { cacheResults: !refreshCache }
        })
      );
    }

    if (requestedAnalysis.includes('contextual_help')) {
      // Determine appropriate help situation based on project state
      const situation = determineHelpSituation(response.projectUnderstanding);
      analysisPromises.push(
        coordinator.createContextualHelp(basketId, situation)
      );
    }

    // Process additional analysis requests
    const additionalAnalyses = await Promise.all(analysisPromises);
    
    additionalAnalyses.forEach((analysis, index) => {
      const requestedType = requestedAnalysis[index];
      
      if (requestedType === 'health_assessment' && analysis.healthAssessment) {
        comprehensiveResponse.analysis.healthAssessment = analysis.healthAssessment;
      } else if (requestedType === 'creative_opportunities' && analysis.creativeOpportunities) {
        comprehensiveResponse.analysis.creativeOpportunities = analysis.creativeOpportunities;
      } else if (requestedType === 'contextual_help') {
        comprehensiveResponse.analysis.contextualHelp = analysis;
      }
    });

    // Add insights and progress if available
    if (response.insights) {
      comprehensiveResponse.insights = response.insights;
    }

    if (response.learningProgress) {
      comprehensiveResponse.learningProgress = response.learningProgress;
    }

    return NextResponse.json(comprehensiveResponse);

  } catch (error) {
    console.error('Comprehensive guidance API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'I encountered an issue generating comprehensive guidance.',
      fallbackMessage: "I'm still here to help - try a simpler guidance request or add more content to your project.",
      suggestedActions: [
        "Try requesting guidance again with simpler parameters",
        "Add more content to help me understand your project better",
        "Ask a specific question about your project",
        "Check that your project has sufficient content for analysis"
      ]
    }, { status: 500 });
  }
}

// Helper function to determine appropriate help situation
function determineHelpSituation(projectUnderstanding: any): 'empty_project' | 'first_content' | 'building_themes' | 'seeking_connections' | 'strategic_planning' {
  const stage = projectUnderstanding.intelligenceLevel.stage;
  const confidence = projectUnderstanding.confidence.level;
  const themesCount = projectUnderstanding.discoveredThemes.length;

  if (confidence === 'just_getting_started') {
    return 'empty_project';
  }
  
  if (stage === 'learning') {
    return 'first_content';
  }
  
  if (stage === 'understanding' && themesCount < 3) {
    return 'building_themes';
  }
  
  if (stage === 'insights') {
    return 'seeking_connections';
  }
  
  return 'strategic_planning';
}