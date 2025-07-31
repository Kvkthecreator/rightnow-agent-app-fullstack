/**
 * Narrative API: AI Conversation
 * 
 * This endpoint provides conversational AI assistance through the narrative agent layer.
 * It enables natural dialogue about the user's project with contextual understanding.
 * 
 * CRITICAL: This API must NEVER expose technical substrate vocabulary.
 * All responses are conversational and user-friendly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AgentCoordinator } from '@/lib/coordination/AgentCoordinator';

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
    
    // Extract conversation parameters
    const {
      message,
      userContext,
      conversationHistory = [],
      requestType = 'chat'
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Please provide a message for me to respond to.',
        suggestion: 'Try asking me something about your project!'
      }, { status: 400 });
    }

    // Verify user has access to this basket
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name, user_id')
      .eq('id', basketId)
      .eq('user_id', user.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ 
        success: false,
        error: 'I cannot find the project you are referring to.',
        suggestion: 'Please make sure you are accessing a valid project.'
      }, { status: 404 });
    }

    // Create agent coordinator and process conversation request
    const coordinator = new AgentCoordinator(supabase);
    
    const narrativeRequest = {
      basketId,
      requestType: 'conversation' as const,
      context: {
        userQuery: message,
        userContext: userContext || { name: user.email?.split('@')[0] }
      },
      options: {
        includeInsights: true,
        cacheResults: true,
        analysisDepth: 'standard' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    if (!response.conversationalResponse) {
      throw new Error('No conversational response generated');
    }

    const conversation = response.conversationalResponse;

    // Return conversational response
    return NextResponse.json({
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Core conversational response
      conversation: {
        message: conversation.message,
        tone: conversation.tone,
        
        // Contextual suggestions for user actions
        suggestions: conversation.suggestions.map(suggestion => ({
          action: suggestion.action,
          description: suggestion.description,
          userBenefit: suggestion.userBenefit,
          priority: suggestion.priority
        })),
        
        // Follow-up questions to continue conversation
        followUpQuestions: conversation.followUpQuestions,
        
        // Conversation context
        assistantPersonality: conversation.context.assistantPersonality,
        userEngagementLevel: conversation.context.userEngagementLevel,
        conversationFlow: conversation.context.conversationFlow
      },

      // Current project understanding context
      projectContext: {
        currentUnderstanding: response.projectUnderstanding.currentUnderstanding,
        intelligenceLevel: response.projectUnderstanding.intelligenceLevel.stage,
        confidenceLevel: response.projectUnderstanding.confidence.level,
        discoveredThemes: response.projectUnderstanding.discoveredThemes.length,
        nextSteps: response.projectUnderstanding.nextSteps.slice(0, 2)
      },

      // Optional insights if available
      ...(response.insights && response.insights.length > 0 && {
        relatedInsights: response.insights.slice(0, 2).map(insight => ({
          insight: insight.insight,
          advice: insight.actionableAdvice
        }))
      }),

      // Response metadata
      metadata: {
        processingTime: `${response.processingTime}ms`,
        responseType: 'conversational',
        requestId: response.requestId,
        timestamp: new Date().toISOString(),
        conversationId: `conv_${basketId}_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Conversation API error:', error);
    
    // Return conversational error response
    return NextResponse.json({
      success: false,
      conversation: {
        message: "I'm having a bit of trouble right now, but I'm still here to help! Could you try asking me again?",
        tone: 'helpful',
        suggestions: [
          {
            action: "Try your question again",
            description: "Sometimes a simple retry resolves temporary issues",
            userBenefit: "Get the response you were looking for",
            priority: 'immediate'
          },
          {
            action: "Ask something else about your project",
            description: "I might be able to help with a different question",
            userBenefit: "Continue our conversation about your work",
            priority: 'helpful'
          }
        ],
        followUpQuestions: [
          "What would you like to know about your project?",
          "Is there something specific I can help you with?",
          "What aspect of your work interests you most right now?"
        ]
      },
      error: 'Temporary conversation processing issue',
      fallbackMessage: "I'm still learning about your project and ready to help once this resolves."
    }, { status: 500 });
  }
}

// GET endpoint for conversation context and suggestions
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
    const contextType = searchParams.get('contextType') || 'general';

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

    // Create agent coordinator and get conversation context
    const coordinator = new AgentCoordinator(supabase);
    
    const narrativeRequest = {
      basketId,
      requestType: 'understanding' as const,
      options: {
        cacheResults: true,
        analysisDepth: 'basic' as const
      }
    };

    const response = await coordinator.processNarrativeIntelligence(narrativeRequest);

    // Generate conversation starters and context
    const conversationStarters = generateConversationStarters(
      response.projectUnderstanding,
      contextType
    );

    const conversationContext = {
      intelligenceLevel: response.projectUnderstanding.intelligenceLevel.stage,
      confidenceLevel: response.projectUnderstanding.confidence.level,
      projectState: response.projectUnderstanding.confidence.explanation,
      themesAvailable: response.projectUnderstanding.discoveredThemes.length > 0,
      suggestedTopics: generateSuggestedTopics(response.projectUnderstanding)
    };

    return NextResponse.json({
      success: true,
      basketId: response.basketId,
      projectName: basket.name,
      
      // Conversation context and starters
      conversationStarters,
      conversationContext,
      
      // Quick conversation actions
      quickActions: [
        {
          label: "Tell me about my project",
          message: "What do you understand about my project so far?",
          description: "Get an overview of my current understanding"
        },
        {
          label: "Show me themes",
          message: "What themes have you identified in my work?",
          description: "Explore the patterns I've discovered"
        },
        {
          label: "What should I do next?",
          message: "What do you recommend I work on next?",
          description: "Get personalized guidance for next steps"
        },
        {
          label: "Help me understand connections",
          message: "What connections do you see in my project?",
          description: "Discover relationships between ideas"
        }
      ],

      metadata: {
        contextType,
        timestamp: new Date().toISOString(),
        availableFeatures: [
          'conversational_assistance',
          'project_understanding',
          'theme_exploration',
          'strategic_guidance'
        ]
      }
    });

  } catch (error) {
    console.error('Conversation context API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'I had trouble preparing our conversation context.',
      fallbackStarters: [
        "Hi! What would you like to know about your project?",
        "I'm ready to help - what can I assist you with?",
        "What aspect of your work interests you most?"
      ],
      suggestion: "Try starting a conversation anyway - I'm here to help!"
    }, { status: 500 });
  }
}

// Helper functions for conversation context
function generateConversationStarters(projectUnderstanding: any, contextType: string): string[] {
  const stage = projectUnderstanding.intelligenceLevel.stage;
  const themes = projectUnderstanding.discoveredThemes;
  
  const starters: string[] = [];

  switch (stage) {
    case 'learning':
      starters.push(
        "I'm ready to learn about your project - what are you working on?",
        "What's the most important thing I should understand about your work?",
        "Tell me about your goals for this project"
      );
      break;

    case 'understanding':
      starters.push(
        "I'm developing a good sense of your project - what would you like to explore?",
        "What aspects of your work would you like me to focus on?",
        "I see some interesting patterns emerging - shall we discuss them?"
      );
      break;

    case 'insights':
      starters.push(
        "I have solid insights about your project - what would you like to know?",
        "I can see interesting connections in your work - want to explore them?",
        "What strategic questions can I help you think through?"
      );
      break;

    case 'deep_knowledge':
      starters.push(
        "I have comprehensive understanding of your project - how can I help?",
        "What strategic opportunities should we explore together?",
        "I can offer deep insights - what interests you most?"
      );
      break;
  }

  // Add theme-specific starters if themes exist
  if (themes.length > 0) {
    const mainTheme = themes[0].name;
    starters.push(`I notice ${mainTheme} is important in your work - want to discuss it?`);
  }

  return starters.slice(0, 4);
}

function generateSuggestedTopics(projectUnderstanding: any): string[] {
  const topics: string[] = [];
  const stage = projectUnderstanding.intelligenceLevel.stage;
  const themes = projectUnderstanding.discoveredThemes;

  // Always available topics
  topics.push("Project overview", "Next steps", "Progress so far");

  // Stage-specific topics
  if (stage === 'understanding' || stage === 'insights' || stage === 'deep_knowledge') {
    topics.push("Themes and patterns");
  }

  if (stage === 'insights' || stage === 'deep_knowledge') {
    topics.push("Strategic insights", "Connections between ideas");
  }

  if (stage === 'deep_knowledge') {
    topics.push("Creative opportunities", "Strategic planning");
  }

  // Theme-specific topics
  themes.forEach((theme: any) => {
    topics.push(`${theme.name} exploration`);
  });

  return topics.slice(0, 8);
}