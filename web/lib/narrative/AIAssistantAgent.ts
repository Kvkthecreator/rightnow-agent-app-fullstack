/**
 * Narrative Agent: AI Assistant
 * 
 * This agent provides conversational AI assistance and guidance for users.
 * It transforms technical capabilities into friendly, helpful interactions.
 * 
 * CRITICAL: This agent must ONLY contain user-facing conversational language.
 * It consumes technical substrate and produces human-centered assistance.
 */

import { CoordinatedAnalysisResult } from '../infrastructure/DataCoordinationAgent';
import { ProjectUnderstanding, ProjectInsight } from './ProjectUnderstandingAgent';

// User-facing conversational structures
export interface ConversationalResponse {
  message: string;
  tone: 'helpful' | 'encouraging' | 'insightful' | 'collaborative' | 'strategic';
  suggestions: ConversationalSuggestion[];
  followUpQuestions: string[];
  context: ResponseContext;
}

export interface ConversationalSuggestion {
  action: string;
  description: string;
  userBenefit: string;
  priority: 'immediate' | 'helpful' | 'explore_later';
}

export interface ResponseContext {
  assistantPersonality: 'curious_learner' | 'knowledgeable_guide' | 'strategic_partner' | 'creative_collaborator';
  userEngagementLevel: 'new_user' | 'exploring' | 'actively_building' | 'seeking_insights';
  conversationFlow: 'greeting' | 'guidance' | 'analysis_sharing' | 'problem_solving' | 'brainstorming';
}

export interface GuidanceRecommendation {
  title: string;
  description: string;
  reasoning: string;
  actionSteps: string[];
  expectedOutcome: string;
  difficulty: 'easy' | 'moderate' | 'advanced';
}

export interface ContextualHelp {
  situation: string;
  helpMessage: string;
  quickActions: Array<{
    label: string;
    description: string;
    outcome: string;
  }>;
  learningOpportunity?: string;
}

/**
 * Narrative Agent: AI Assistant
 * 
 * Provides conversational AI assistance with human-centered communication.
 * Contains ONLY user-facing conversational and guidance language.
 */
export class AIAssistantAgent {
  /**
   * Generate contextual conversational response based on project state
   */
  generateConversationalResponse(
    understanding: ProjectUnderstanding,
    userQuery?: string,
    context?: Partial<ResponseContext>
  ): ConversationalResponse {
    const assistantPersonality = this.determinePersonality(understanding);
    const userEngagementLevel = this.assessEngagementLevel(understanding);
    const conversationFlow = this.identifyConversationFlow(userQuery, understanding);

    const message = this.craftContextualMessage(
      understanding,
      userQuery,
      assistantPersonality,
      conversationFlow
    );

    const suggestions = this.generateContextualSuggestions(understanding, userEngagementLevel);
    const followUpQuestions = this.createFollowUpQuestions(understanding, conversationFlow);

    return {
      message,
      tone: this.selectTone(assistantPersonality, conversationFlow),
      suggestions,
      followUpQuestions,
      context: {
        assistantPersonality,
        userEngagementLevel,
        conversationFlow
      }
    };
  }

  /**
   * Provide strategic guidance recommendations
   */
  generateGuidanceRecommendations(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult,
    focusArea?: 'development' | 'organization' | 'insights' | 'next_steps'
  ): GuidanceRecommendation[] {
    const recommendations: GuidanceRecommendation[] = [];
    const intelligenceLevel = understanding.intelligenceLevel.stage;

    if (focusArea === 'development' || !focusArea) {
      recommendations.push(...this.createDevelopmentRecommendations(understanding, intelligenceLevel));
    }

    if (focusArea === 'organization' || !focusArea) {
      recommendations.push(...this.createOrganizationRecommendations(understanding, analysisResult));
    }

    if (focusArea === 'insights' || !focusArea) {
      recommendations.push(...this.createInsightRecommendations(understanding, analysisResult));
    }

    if (focusArea === 'next_steps' || !focusArea) {
      recommendations.push(...this.createNextStepsRecommendations(understanding));
    }

    return recommendations.slice(0, 5); // Return top 5 most relevant recommendations
  }

  /**
   * Create contextual help for specific situations
   */
  createContextualHelp(
    situation: 'empty_project' | 'first_content' | 'building_themes' | 'seeking_connections' | 'strategic_planning',
    understanding: ProjectUnderstanding
  ): ContextualHelp {
    switch (situation) {
      case 'empty_project':
        return this.createEmptyProjectHelp(understanding);
      case 'first_content':
        return this.createFirstContentHelp(understanding);
      case 'building_themes':
        return this.createThemeBuildingHelp(understanding);
      case 'seeking_connections':
        return this.createConnectionsHelp(understanding);
      case 'strategic_planning':
        return this.createStrategicPlanningHelp(understanding);
      default:
        return this.createGeneralHelp(understanding);
    }
  }

  /**
   * Generate encouraging progress messages
   */
  createProgressEncouragement(
    understanding: ProjectUnderstanding,
    recentActivity?: {
      contentAdded: number;
      themesDiscovered: number;
      connectionsFound: number;
    }
  ): {
    celebrationMessage: string;
    progressHighlight: string;
    motivationalGuidance: string;
    nextMilestone: string;
  } {
    const stage = understanding.intelligenceLevel.stage;
    const confidence = understanding.confidence.level;

    return {
      celebrationMessage: this.createCelebrationMessage(stage, recentActivity),
      progressHighlight: this.createProgressHighlight(understanding, recentActivity),
      motivationalGuidance: this.createMotivationalGuidance(confidence, stage),
      nextMilestone: this.createNextMilestone(understanding)
    };
  }

  /**
   * Transform technical insights into conversational sharing
   */
  shareInsightsConversationally(
    insights: ProjectInsight[],
    understanding: ProjectUnderstanding
  ): {
    introduction: string;
    insightNarratives: Array<{
      insight: string;
      storytelling: string;
      userValue: string;
      invitation: string;
    }>;
    conclusion: string;
  } {
    const personality = this.determinePersonality(understanding);
    
    return {
      introduction: this.createInsightIntroduction(insights.length, personality),
      insightNarratives: insights.map(insight => ({
        insight: insight.insight,
        storytelling: this.createInsightStorytelling(insight, personality),
        userValue: this.explainInsightValue(insight, understanding),
        invitation: this.createInsightInvitation(insight)
      })),
      conclusion: this.createInsightConclusion(insights.length, understanding)
    };
  }

  // Private conversational methods
  private determinePersonality(understanding: ProjectUnderstanding): ResponseContext['assistantPersonality'] {
    switch (understanding.intelligenceLevel.stage) {
      case 'learning':
        return 'curious_learner';
      case 'understanding':
        return 'knowledgeable_guide';
      case 'insights':
        return 'strategic_partner';
      case 'deep_knowledge':
        return 'creative_collaborator';
      default:
        return 'curious_learner';
    }
  }

  private assessEngagementLevel(understanding: ProjectUnderstanding): ResponseContext['userEngagementLevel'] {
    const confidence = understanding.confidence.level;
    switch (confidence) {
      case 'just_getting_started':
        return 'new_user';
      case 'building_understanding':
        return 'exploring';
      case 'solid_grasp':
        return 'actively_building';
      case 'comprehensive_knowledge':
        return 'seeking_insights';
      default:
        return 'new_user';
    }
  }

  private identifyConversationFlow(
    userQuery: string | undefined,
    understanding: ProjectUnderstanding
  ): ResponseContext['conversationFlow'] {
    if (!userQuery) {
      return understanding.confidence.level === 'just_getting_started' ? 'greeting' : 'guidance';
    }

    const queryLower = userQuery.toLowerCase();
    if (queryLower.includes('help') || queryLower.includes('how')) return 'guidance';
    if (queryLower.includes('what') || queryLower.includes('analyze')) return 'analysis_sharing';
    if (queryLower.includes('idea') || queryLower.includes('think')) return 'brainstorming';
    if (queryLower.includes('problem') || queryLower.includes('stuck')) return 'problem_solving';

    return 'guidance';
  }

  private craftContextualMessage(
    understanding: ProjectUnderstanding,
    userQuery: string | undefined,
    personality: ResponseContext['assistantPersonality'],
    flow: ResponseContext['conversationFlow']
  ): string {
    if (userQuery) {
      return this.respondToUserQuery(userQuery, understanding, personality);
    }

    switch (flow) {
      case 'greeting':
        return understanding.personalizedGreeting;
      case 'guidance':
        return this.createGuidanceMessage(understanding, personality);
      case 'analysis_sharing':
        return this.createAnalysisMessage(understanding, personality);
      default:
        return this.createGeneralMessage(understanding, personality);
    }
  }

  private selectTone(
    personality: ResponseContext['assistantPersonality'],
    flow: ResponseContext['conversationFlow']
  ): ConversationalResponse['tone'] {
    if (flow === 'greeting') return 'encouraging';
    if (flow === 'problem_solving') return 'helpful';
    if (flow === 'brainstorming') return 'collaborative';

    switch (personality) {
      case 'curious_learner':
        return 'encouraging';
      case 'knowledgeable_guide':
        return 'helpful';
      case 'strategic_partner':
        return 'strategic';
      case 'creative_collaborator':
        return 'collaborative';
      default:
        return 'helpful';
    }
  }

  private generateContextualSuggestions(
    understanding: ProjectUnderstanding,
    engagementLevel: ResponseContext['userEngagementLevel']
  ): ConversationalSuggestion[] {
    const suggestions: ConversationalSuggestion[] = [];

    switch (engagementLevel) {
      case 'new_user':
        suggestions.push(
          {
            action: "Share your first idea or document",
            description: "Tell me about what you're working on so I can start understanding",
            userBenefit: "I'll begin learning about your project and can offer initial insights",
            priority: 'immediate'
          },
          {
            action: "Upload a relevant file",
            description: "Share any documents, notes, or materials related to your project",
            userBenefit: "I can analyze your existing work and understand your context faster",
            priority: 'helpful'
          }
        );
        break;

      case 'exploring':
        suggestions.push(
          {
            action: "Add more context about your goals",
            description: "Tell me more about what you're trying to achieve",
            userBenefit: "I can provide more targeted guidance and suggestions",
            priority: 'immediate'
          },
          {
            action: "Explore the themes I've identified",
            description: "Review the patterns I'm seeing in your work",
            userBenefit: "Confirm whether my understanding aligns with your vision",
            priority: 'helpful'
          }
        );
        break;

      case 'actively_building':
        suggestions.push(
          {
            action: "Ask me about connections I've found",
            description: "I can share insights about relationships in your work",
            userBenefit: "Discover unexpected connections that might inspire new directions",
            priority: 'immediate'
          },
          {
            action: "Request strategic guidance",
            description: "I can offer suggestions for developing your project further",
            userBenefit: "Get AI-powered recommendations for your next steps",
            priority: 'helpful'
          }
        );
        break;

      case 'seeking_insights':
        suggestions.push(
          {
            action: "Dive deep into my analysis",
            description: "Explore the comprehensive insights I've developed",
            userBenefit: "Uncover sophisticated patterns and strategic opportunities",
            priority: 'immediate'
          },
          {
            action: "Collaborate on strategic planning",
            description: "Work together to plan your project's future direction",
            userBenefit: "Leverage my deep understanding for strategic decision-making",
            priority: 'helpful'
          }
        );
        break;
    }

    return suggestions;
  }

  private createFollowUpQuestions(
    understanding: ProjectUnderstanding,
    flow: ResponseContext['conversationFlow']
  ): string[] {
    const questions: string[] = [];

    switch (flow) {
      case 'greeting':
        questions.push(
          "What kind of project are you working on?",
          "What would you like me to understand first?",
          "Do you have any materials you'd like to share?"
        );
        break;

      case 'guidance':
        questions.push(
          "What aspect of your project would you like to explore?",
          "Are there any specific challenges you're facing?",
          "What would be most helpful for me to focus on?"
        );
        break;

      case 'analysis_sharing':
        questions.push(
          "Does my understanding of your project align with your vision?",
          "Are there themes I've missed that are important to you?",
          "What connections surprise you the most?"
        );
        break;

      case 'brainstorming':
        questions.push(
          "What ideas are you most excited to explore?",
          "Are there any directions you haven't considered yet?",
          "What would success look like for this project?"
        );
        break;

      case 'problem_solving':
        questions.push(
          "What's the biggest challenge you're facing right now?",
          "Have you tried any approaches that didn't work?",
          "What resources or constraints should I be aware of?"
        );
        break;
    }

    return questions.slice(0, 3);
  }

  private respondToUserQuery(
    query: string,
    understanding: ProjectUnderstanding,
    personality: ResponseContext['assistantPersonality']
  ): string {
    // This would be much more sophisticated in a real implementation
    const queryLower = query.toLowerCase();

    if (queryLower.includes('help')) {
      return this.createHelpResponse(understanding, personality);
    }

    if (queryLower.includes('understand') || queryLower.includes('know')) {
      return understanding.currentUnderstanding;
    }

    if (queryLower.includes('theme') || queryLower.includes('pattern')) {
      return this.createThemeResponse(understanding, personality);
    }

    if (queryLower.includes('next') || queryLower.includes('should')) {
      return this.createNextStepsResponse(understanding, personality);
    }

    return this.createGeneralResponse(query, understanding, personality);
  }

  private createGeneralMessage(
    understanding: ProjectUnderstanding,
    personality: ResponseContext['assistantPersonality']
  ): string {
    switch (personality) {
      case 'curious_learner':
        return `I'm excited to learn more about your project! ${understanding.currentUnderstanding}`;
      case 'knowledgeable_guide':
        return `I'm here to guide you through your project development. ${understanding.currentUnderstanding}`;
      case 'strategic_partner':
        return `Let's work together strategically on your project. ${understanding.currentUnderstanding}`;
      case 'creative_collaborator':
        return `I'm ready to collaborate creatively with you! ${understanding.currentUnderstanding}`;
      default:
        return understanding.currentUnderstanding;
    }
  }

  private createGuidanceMessage(
    understanding: ProjectUnderstanding,
    personality: ResponseContext['assistantPersonality']
  ): string {
    const nextStep = understanding.nextSteps[0];
    switch (personality) {
      case 'curious_learner':
        return `I'm eager to understand your project better! Based on what I know so far, I'd suggest: ${nextStep}`;
      case 'knowledgeable_guide':
        return `Here's what I recommend for your project's development: ${nextStep}`;
      case 'strategic_partner':
        return `From a strategic perspective, your next move should be: ${nextStep}`;
      case 'creative_collaborator':
        return `Let's explore this together! I think we should: ${nextStep}`;
      default:
        return `I suggest: ${nextStep}`;
    }
  }

  private createAnalysisMessage(
    understanding: ProjectUnderstanding,
    personality: ResponseContext['assistantPersonality']
  ): string {
    const themeCount = understanding.discoveredThemes.length;
    const confidenceDesc = understanding.confidence.explanation;

    switch (personality) {
      case 'curious_learner':
        return `I'm learning so much about your project! I've discovered ${themeCount} key themes and ${confidenceDesc.toLowerCase()}`;
      case 'knowledgeable_guide':
        return `My analysis shows ${themeCount} main themes in your work. ${confidenceDesc}`;
      case 'strategic_partner':
        return `Strategically, I see ${themeCount} core themes that define your project. ${confidenceDesc}`;
      case 'creative_collaborator':
        return `What fascinates me is how ${themeCount} themes weave through your work! ${confidenceDesc}`;
      default:
        return `I've identified ${themeCount} themes. ${confidenceDesc}`;
    }
  }

  // Additional helper methods for creating specific types of help and recommendations
  private createEmptyProjectHelp(understanding: ProjectUnderstanding): ContextualHelp {
    return {
      situation: "Starting a new project",
      helpMessage: "Every great project begins with a single idea. I'm here to grow alongside your thoughts and help you develop them into something meaningful.",
      quickActions: [
        {
          label: "Share your first idea",
          description: "Tell me what you're thinking about",
          outcome: "I'll start understanding your vision"
        },
        {
          label: "Upload a document",
          description: "Share any existing materials",
          outcome: "I'll analyze your content and find patterns"
        },
        {
          label: "Describe your goals",
          description: "Explain what you want to achieve",
          outcome: "I'll tailor my assistance to your objectives"
        }
      ],
      learningOpportunity: "This is the perfect time to establish the foundation of our collaboration"
    };
  }

  private createFirstContentHelp(understanding: ProjectUnderstanding): ContextualHelp {
    return {
      situation: "Adding your first content",
      helpMessage: "Great start! I'm beginning to understand your project. The more you share, the better I can assist you in developing and organizing your ideas.",
      quickActions: [
        {
          label: "Add more details",
          description: "Expand on your initial ideas",
          outcome: "I'll develop a richer understanding"
        },
        {
          label: "Share related thoughts",
          description: "Add connected ideas or materials",
          outcome: "I'll start seeing patterns and themes"
        },
        {
          label: "Ask for insights",
          description: "See what I've learned so far",
          outcome: "Get early feedback on your direction"
        }
      ],
      learningOpportunity: "Each addition helps me understand your unique perspective and goals"
    };
  }

  private createThemeBuildingHelp(understanding: ProjectUnderstanding): ContextualHelp {
    const themeCount = understanding.discoveredThemes.length;
    return {
      situation: "Building thematic understanding",
      helpMessage: `I've identified ${themeCount} themes in your work and I'm starting to see how they connect. This is where your project really begins to take shape!`,
      quickActions: [
        {
          label: "Explore theme connections",
          description: "See how your themes relate to each other",
          outcome: "Discover unexpected relationships in your work"
        },
        {
          label: "Develop weaker themes",
          description: "Add content to strengthen emerging themes",
          outcome: "Create more balanced thematic development"
        },
        {
          label: "Get theme insights",
          description: "Learn what your themes reveal about your project",
          outcome: "Gain strategic understanding of your direction"
        }
      ],
      learningOpportunity: "This is when projects often have breakthrough moments of clarity"
    };
  }

  private createConnectionsHelp(understanding: ProjectUnderstanding): ContextualHelp {
    return {
      situation: "Seeking deeper connections",
      helpMessage: "I can see meaningful relationships forming between different parts of your project. These connections often reveal the most interesting insights!",
      quickActions: [
        {
          label: "Explore relationship insights",
          description: "See how different elements connect",
          outcome: "Discover the deeper structure of your work"
        },
        {
          label: "Strengthen weak connections",
          description: "Add content that bridges related ideas",
          outcome: "Create more coherent project flow"
        },
        {
          label: "Find surprising connections",
          description: "Look for unexpected relationships",
          outcome: "Uncover hidden opportunities in your work"
        }
      ],
      learningOpportunity: "Connection analysis often reveals the most strategic insights"
    };
  }

  private createStrategicPlanningHelp(understanding: ProjectUnderstanding): ContextualHelp {
    return {
      situation: "Strategic planning and development",
      helpMessage: "With my comprehensive understanding of your project, I can help you make strategic decisions about direction, priorities, and next steps.",
      quickActions: [
        {
          label: "Review strategic insights",
          description: "Get comprehensive analysis of your project",
          outcome: "Understand your work from a high-level perspective"
        },
        {
          label: "Plan next phases",
          description: "Develop roadmap for continued development",
          outcome: "Clear direction for future work"
        },
        {
          label: "Identify opportunities",
          description: "Find areas with the most potential",
          outcome: "Focus efforts where they'll have most impact"
        }
      ],
      learningOpportunity: "Strategic collaboration leverages everything we've learned together"
    };
  }

  private createGeneralHelp(understanding: ProjectUnderstanding): ContextualHelp {
    return {
      situation: "General project assistance",
      helpMessage: "I'm here to help with whatever aspect of your project needs attention. My understanding continues to grow with every interaction.",
      quickActions: [
        {
          label: "Ask me anything",
          description: "Get insights about any aspect of your work",
          outcome: "Personalized guidance based on my understanding"
        },
        {
          label: "Explore new directions",
          description: "Brainstorm possibilities for your project",
          outcome: "Discover new opportunities and approaches"
        },
        {
          label: "Get progress update",
          description: "See how your project has developed",
          outcome: "Understand your growth and achievements"
        }
      ]
    };
  }

  // Methods for creating recommendations
  private createDevelopmentRecommendations(
    understanding: ProjectUnderstanding,
    intelligenceLevel: string
  ): GuidanceRecommendation[] {
    const recommendations: GuidanceRecommendation[] = [];

    if (intelligenceLevel === 'learning' || intelligenceLevel === 'understanding') {
      recommendations.push({
        title: "Expand Your Content Foundation",
        description: "Add more documents, ideas, or materials to give me richer context to work with",
        reasoning: "I need more content to develop deeper insights about your project's themes and direction",
        actionSteps: [
          "Upload any relevant documents you have",
          "Capture additional thoughts or ideas",
          "Add context about your goals and constraints"
        ],
        expectedOutcome: "I'll develop stronger thematic analysis and more targeted guidance",
        difficulty: 'easy'
      });
    }

    return recommendations;
  }

  private createOrganizationRecommendations(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): GuidanceRecommendation[] {
    const recommendations: GuidanceRecommendation[] = [];
    const contentCount = analysisResult.content_analyses.length;

    if (contentCount > 5) {
      recommendations.push({
        title: "Organize Your Ideas by Theme",
        description: "Group related content around the key themes I've identified",
        reasoning: "With multiple pieces of content, organization will help you see patterns more clearly",
        actionSteps: [
          "Review the themes I've identified",
          "Group similar content together",
          "Create clear relationships between related ideas"
        ],
        expectedOutcome: "Better organization will reveal deeper insights and make your project more coherent",
        difficulty: 'moderate'
      });
    }

    return recommendations;
  }

  private createInsightRecommendations(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): GuidanceRecommendation[] {
    const recommendations: GuidanceRecommendation[] = [];
    const stage = understanding.intelligenceLevel.stage;

    if (stage === 'insights' || stage === 'deep_knowledge') {
      recommendations.push({
        title: "Leverage Advanced Insights",
        description: "Explore the sophisticated patterns and connections I've discovered in your work",
        reasoning: "My deep understanding of your project can reveal strategic opportunities",
        actionSteps: [
          "Ask me about specific insights I've developed",
          "Explore the connections between different themes",
          "Consider how insights might influence your next steps"
        ],
        expectedOutcome: "Uncover strategic opportunities and gain new perspectives on your work",
        difficulty: 'advanced'
      });
    }

    return recommendations;
  }

  private createNextStepsRecommendations(understanding: ProjectUnderstanding): GuidanceRecommendation[] {
    const nextSteps = understanding.nextSteps;
    
    return [{
      title: "Follow Strategic Next Steps",
      description: nextSteps[0] || "Continue developing your project",
      reasoning: "Based on my current understanding, this is the most impactful next action",
      actionSteps: nextSteps.slice(0, 3),
      expectedOutcome: "Progress your project in the most strategic direction",
      difficulty: 'moderate'
    }];
  }

  // Methods for creating encouraging messages
  private createCelebrationMessage(
    stage: string,
    recentActivity?: { contentAdded: number; themesDiscovered: number; connectionsFound: number }
  ): string {
    if (recentActivity?.contentAdded > 0) {
      return `Excellent! You've added ${recentActivity.contentAdded} new piece${recentActivity.contentAdded !== 1 ? 's' : ''} of content. Your project is really taking shape!`;
    }

    switch (stage) {
      case 'learning':
        return "Great start! Every project begins with those first important steps.";
      case 'understanding':
        return "Wonderful progress! I'm developing a solid understanding of your work.";
      case 'insights':
        return "Fantastic! Your project has reached a level where I can offer meaningful insights.";
      case 'deep_knowledge':
        return "Amazing! We've built a comprehensive understanding together.";
      default:
        return "Great work on developing your project!";
    }
  }

  private createProgressHighlight(
    understanding: ProjectUnderstanding,
    recentActivity?: { contentAdded: number; themesDiscovered: number; connectionsFound: number }
  ): string {
    const themes = understanding.discoveredThemes.length;
    const confidence = understanding.confidence.level;

    if (themes > 0) {
      return `I've identified ${themes} key theme${themes !== 1 ? 's' : ''} and have ${confidence.replace(/_/g, ' ')} of your project.`;
    }

    return understanding.confidence.explanation;
  }

  private createMotivationalGuidance(confidence: string, stage: string): string {
    switch (confidence) {
      case 'just_getting_started':
        return "Every expert was once a beginner. Your project has unlimited potential!";
      case 'building_understanding':
        return "You're making excellent progress. Each addition strengthens our shared understanding.";
      case 'solid_grasp':
        return "Your project is well-developed and ready for deeper exploration and insights.";
      case 'comprehensive_knowledge':
        return "You've built something impressive! Now we can focus on strategic opportunities.";
      default:
        return "Keep building - great things take time and your project is heading in an exciting direction.";
    }
  }

  private createNextMilestone(understanding: ProjectUnderstanding): string {
    const stage = understanding.intelligenceLevel.stage;
    
    switch (stage) {
      case 'learning':
        return "Next milestone: Develop clear themes in your project";
      case 'understanding':
        return "Next milestone: Achieve strong thematic coherence";
      case 'insights':
        return "Next milestone: Leverage insights for strategic planning";
      case 'deep_knowledge':
        return "Next milestone: Execute strategic opportunities";
      default:
        return "Continue building your project step by step";
    }
  }

  // Helper methods for specific response types
  private createHelpResponse(understanding: ProjectUnderstanding, personality: ResponseContext['assistantPersonality']): string {
    const nextStep = understanding.nextSteps[0];
    switch (personality) {
      case 'curious_learner':
        return `I'm here to help! Based on what I understand so far, I think the most helpful thing would be: ${nextStep}`;
      case 'knowledgeable_guide':
        return `I can definitely help you. My recommendation is: ${nextStep}`;
      case 'strategic_partner':
        return `Let me offer strategic guidance: ${nextStep}`;
      case 'creative_collaborator':
        return `I'd love to help! Let's try this approach: ${nextStep}`;
      default:
        return `I'm here to help! I suggest: ${nextStep}`;
    }
  }

  private createThemeResponse(understanding: ProjectUnderstanding, personality: ResponseContext['assistantPersonality']): string {
    const themeCount = understanding.discoveredThemes.length;
    if (themeCount === 0) {
      return "I haven't identified distinct themes yet, but as you add more content, patterns will start to emerge!";
    }

    const mainTheme = understanding.discoveredThemes[0]?.name || "your main focus";
    switch (personality) {
      case 'curious_learner':
        return `I'm fascinated by the ${themeCount} themes I see! The strongest one seems to be ${mainTheme}.`;
      case 'knowledgeable_guide':
        return `I've identified ${themeCount} key themes, with ${mainTheme} being the most prominent.`;
      case 'strategic_partner':
        return `Strategically, your ${themeCount} themes center around ${mainTheme}, which could be leveraged for future development.`;
      case 'creative_collaborator':
        return `What excites me is how ${mainTheme} weaves through your work as one of ${themeCount} rich themes!`;
      default:
        return `I see ${themeCount} themes, with ${mainTheme} being central to your project.`;
    }
  }

  private createNextStepsResponse(understanding: ProjectUnderstanding, personality: ResponseContext['assistantPersonality']): string {
    const nextSteps = understanding.nextSteps.slice(0, 2);
    switch (personality) {
      case 'curious_learner':
        return `I'm excited about what comes next! I'd suggest: ${nextSteps.join(' or ')}.`;
      case 'knowledgeable_guide':
        return `Based on my analysis, your best next steps are: ${nextSteps.join(' or ')}.`;
      case 'strategic_partner':
        return `From a strategic standpoint, you should: ${nextSteps.join(' or ')}.`;
      case 'creative_collaborator':
        return `Let's explore these possibilities together: ${nextSteps.join(' or ')}.`;
      default:
        return `I recommend: ${nextSteps.join(' or ')}.`;
    }
  }

  private createGeneralResponse(query: string, understanding: ProjectUnderstanding, personality: ResponseContext['assistantPersonality']): string {
    switch (personality) {
      case 'curious_learner':
        return `That's an interesting question! Based on what I understand about your project so far: ${understanding.currentUnderstanding}`;
      case 'knowledgeable_guide':
        return `Let me share what I know that might help: ${understanding.currentUnderstanding}`;
      case 'strategic_partner':
        return `From a strategic perspective: ${understanding.currentUnderstanding}`;
      case 'creative_collaborator':
        return `That makes me think about your project in new ways! ${understanding.currentUnderstanding}`;
      default:
        return understanding.currentUnderstanding;
    }
  }

  private createInsightIntroduction(insightCount: number, personality: ResponseContext['assistantPersonality']): string {
    switch (personality) {
      case 'curious_learner':
        return `I'm excited to share ${insightCount} insight${insightCount !== 1 ? 's' : ''} I've discovered about your project!`;
      case 'knowledgeable_guide':
        return `Based on my analysis, here are ${insightCount} key insight${insightCount !== 1 ? 's' : ''} about your work:`;
      case 'strategic_partner':
        return `I've identified ${insightCount} strategic insight${insightCount !== 1 ? 's' : ''} that could shape your project's direction:`;
      case 'creative_collaborator':
        return `What fascinates me are these ${insightCount} insight${insightCount !== 1 ? 's' : ''} that emerged from our collaboration:`;
      default:
        return `Here are ${insightCount} insight${insightCount !== 1 ? 's' : ''} about your project:`;
    }
  }

  private createInsightStorytelling(insight: ProjectInsight, personality: ResponseContext['assistantPersonality']): string {
    switch (personality) {
      case 'curious_learner':
        return `What caught my attention is how ${insight.insight.toLowerCase()}. This emerged as I was exploring your content.`;
      case 'knowledgeable_guide':
        return `My analysis reveals that ${insight.insight.toLowerCase()}. This pattern is supported by the evidence I found.`;
      case 'strategic_partner':
        return `From a strategic viewpoint, ${insight.insight.toLowerCase()}. This represents a key opportunity.`;
      case 'creative_collaborator':
        return `What I find most intriguing is that ${insight.insight.toLowerCase()}. This opens up creative possibilities.`;
      default:
        return `I discovered that ${insight.insight.toLowerCase()}.`;
    }
  }

  private explainInsightValue(insight: ProjectInsight, understanding: ProjectUnderstanding): string {
    const stage = understanding.intelligenceLevel.stage;
    
    switch (stage) {
      case 'learning':
        return "This insight helps establish the foundation of understanding for your project.";
      case 'understanding':
        return "This insight builds on the patterns I'm seeing in your work.";
      case 'insights':
        return "This insight reveals strategic opportunities for your project's development.";
      case 'deep_knowledge':
        return "This insight leverages my comprehensive understanding to guide strategic decisions.";
      default:
        return "This insight helps illuminate important aspects of your project.";
    }
  }

  private createInsightInvitation(insight: ProjectInsight): string {
    return `What do you think about this perspective? ${insight.actionableAdvice}`;
  }

  private createInsightConclusion(insightCount: number, understanding: ProjectUnderstanding): string {
    const confidence = understanding.confidence.level;
    
    switch (confidence) {
      case 'just_getting_started':
        return "These early insights will grow stronger as you add more to your project.";
      case 'building_understanding':
        return `These ${insightCount} insight${insightCount !== 1 ? 's' : ''} reflect my growing understanding of your work.`;
      case 'solid_grasp':
        return `These insights emerge from my solid understanding of your project's direction.`;
      case 'comprehensive_knowledge':
        return `These insights represent the depth of understanding we've built together.`;
      default:
        return "I hope these insights are helpful for your project's development.";
    }
  }
}