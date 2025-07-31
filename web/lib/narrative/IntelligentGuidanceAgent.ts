/**
 * Narrative Agent: Intelligent Guidance
 * 
 * This agent provides strategic and tactical guidance for project development.
 * It transforms technical analysis into actionable, user-friendly recommendations.
 * 
 * CRITICAL: This agent must ONLY contain user-facing guidance language.
 * It consumes technical substrate and produces human-centered strategic advice.
 */

import { CoordinatedAnalysisResult } from '../infrastructure/DataCoordinationAgent';
import { ProjectUnderstanding } from './ProjectUnderstandingAgent';

// User-facing guidance structures
export interface StrategicGuidance {
  title: string;
  description: string;
  recommendation: string;
  reasoning: string;
  actionPlan: ActionStep[];
  expectedOutcome: string;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  difficulty: 'beginner_friendly' | 'moderate_effort' | 'advanced_focus';
}

export interface ActionStep {
  step: string;
  description: string;
  userBenefit: string;
  estimatedTime: string;
  prerequisite?: string;
}

export interface DevelopmentPriority {
  area: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  suggestedActions: string[];
  successIndicators: string[];
}

export interface ProjectHealthAssessment {
  overallHealth: 'excellent' | 'good' | 'developing' | 'needs_attention';
  strengths: string[];
  improvementAreas: string[];
  recommendations: HealthRecommendation[];
  progressTrajectory: 'accelerating' | 'steady' | 'slowing' | 'stalled';
}

export interface HealthRecommendation {
  focus: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'minimal' | 'moderate' | 'significant';
}

export interface CreativeOpportunity {
  opportunity: string;
  description: string;
  inspirationalPrompt: string;
  explorationSteps: string[];
  potentialOutcomes: string[];
}

/**
 * Narrative Agent: Intelligent Guidance
 * 
 * Provides strategic guidance and development recommendations.
 * Contains ONLY user-facing strategic and tactical advice.
 */
export class IntelligentGuidanceAgent {
  /**
   * Generate comprehensive strategic guidance
   */
  generateStrategicGuidance(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult,
    focusArea?: 'development' | 'organization' | 'creativity' | 'completion'
  ): StrategicGuidance[] {
    const guidance: StrategicGuidance[] = [];
    const projectState = analysisResult.basket_classification.state;
    const intelligenceLevel = understanding.intelligenceLevel.stage;

    // Generate guidance based on project state and focus
    if (focusArea === 'development' || !focusArea) {
      guidance.push(...this.createDevelopmentGuidance(projectState, understanding, analysisResult));
    }

    if (focusArea === 'organization' || !focusArea) {
      guidance.push(...this.createOrganizationGuidance(projectState, understanding, analysisResult));
    }

    if (focusArea === 'creativity' || !focusArea) {
      guidance.push(...this.createCreativityGuidance(intelligenceLevel, understanding, analysisResult));
    }

    if (focusArea === 'completion' || !focusArea) {
      guidance.push(...this.createCompletionGuidance(projectState, understanding, analysisResult));
    }

    return guidance.slice(0, 6); // Return top 6 most relevant guidance items
  }

  /**
   * Assess project development priorities
   */
  assessDevelopmentPriorities(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): DevelopmentPriority[] {
    const priorities: DevelopmentPriority[] = [];
    const projectState = analysisResult.basket_classification.state;
    const contentCount = analysisResult.content_analyses.length;
    const themeCount = understanding.discoveredThemes.length;

    // Content development priority
    if (contentCount < 5) {
      priorities.push({
        area: "Content Foundation",
        importance: 'critical',
        rationale: "Your project needs more content to develop strong themes and meaningful insights",
        suggestedActions: [
          "Add 3-5 more documents or ideas",
          "Expand on existing content with more detail",
          "Include background information and context"
        ],
        successIndicators: [
          "Clear themes emerge from your content",
          "I can provide more specific guidance",
          "Connections between ideas become visible"
        ]
      });
    }

    // Theme development priority
    if (themeCount > 0 && themeCount < 3) {
      priorities.push({
        area: "Theme Expansion",
        importance: 'high',
        rationale: "You have good initial themes that could be developed into a richer understanding",
        suggestedActions: [
          "Explore each theme in more depth",
          "Add content that supports or challenges your themes",
          "Look for connections between different themes"
        ],
        successIndicators: [
          "Themes become more nuanced and detailed",
          "Clear relationships between themes emerge",
          "Strategic insights become possible"
        ]
      });
    }

    // Organization priority
    if (contentCount > 8 && projectState !== 'complex') {
      priorities.push({
        area: "Content Organization",
        importance: 'medium',
        rationale: "With substantial content, better organization will unlock deeper insights",
        suggestedActions: [
          "Group related content by theme",
          "Create clear relationships between ideas",
          "Identify the most important concepts"
        ],
        successIndicators: [
          "Content feels more coherent and connected",
          "Navigation between ideas becomes easier",
          "Strategic patterns become clear"
        ]
      });
    }

    return priorities.sort((a, b) => this.priorityWeight(a.importance) - this.priorityWeight(b.importance));
  }

  /**
   * Evaluate project health and provide assessment
   */
  evaluateProjectHealth(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): ProjectHealthAssessment {
    const projectState = analysisResult.basket_classification.state;
    const contentCount = analysisResult.content_analyses.length;
    const themeCount = understanding.discoveredThemes.length;
    const confidenceLevel = understanding.confidence.level;

    // Determine overall health
    const overallHealth = this.assessOverallHealth(projectState, contentCount, themeCount, confidenceLevel);
    
    // Identify strengths
    const strengths = this.identifyProjectStrengths(understanding, analysisResult);
    
    // Identify improvement areas
    const improvementAreas = this.identifyImprovementAreas(understanding, analysisResult);
    
    // Generate health recommendations
    const recommendations = this.generateHealthRecommendations(strengths, improvementAreas, projectState);
    
    // Assess trajectory
    const progressTrajectory = this.assessProgressTrajectory(analysisResult, previousAnalysis);

    return {
      overallHealth,
      strengths,
      improvementAreas,
      recommendations,
      progressTrajectory
    };
  }

  /**
   * Identify creative opportunities in the project
   */
  identifyCreativeOpportunities(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): CreativeOpportunity[] {
    const opportunities: CreativeOpportunity[] = [];
    const themes = understanding.discoveredThemes;
    const projectState = analysisResult.basket_classification.state;

    // Theme-based creative opportunities
    if (themes.length >= 2) {
      opportunities.push({
        opportunity: "Theme Synthesis",
        description: `Explore how your ${themes.length} different themes might work together in unexpected ways`,
        inspirationalPrompt: `What if ${themes[0]?.name} and ${themes[1]?.name} were more connected than they appear?`,
        explorationSteps: [
          "Look for subtle connections between your main themes",
          "Consider how combining themes might create new insights",
          "Experiment with ideas that bridge different areas"
        ],
        potentialOutcomes: [
          "Discover innovative approaches to your project",
          "Find unique angles that haven't been explored",
          "Create synthesis that adds value beyond individual themes"
        ]
      });
    }

    // Content gap opportunities
    if (projectState === 'developing' || projectState === 'rich') {
      opportunities.push({
        opportunity: "Content Gap Exploration",
        description: "Identify and explore areas where your project could expand in interesting directions",
        inspirationalPrompt: "What important aspects of your project haven't been fully explored yet?",
        explorationSteps: [
          "Review your content for potential gaps or missing perspectives",
          "Consider alternative viewpoints on your existing themes",
          "Explore the edges and boundaries of your current focus"
        ],
        potentialOutcomes: [
          "Discover new dimensions of your project",
          "Add depth and richness to existing themes",
          "Find unique angles that strengthen your work"
        ]
      });
    }

    // Cross-connection opportunities
    if (analysisResult.relationship_analysis?.document_connections.length > 0) {
      opportunities.push({
        opportunity: "Unexpected Connections",
        description: "Leverage the surprising connections I've found to spark new creative directions",
        inspirationalPrompt: "What new possibilities emerge when you see your content through the lens of these connections?",
        explorationSteps: [
          "Explore the connections I've identified between your content",
          "Ask what these relationships might suggest about new directions",
          "Consider how strengthening these connections might evolve your project"
        ],
        potentialOutcomes: [
          "Uncover hidden potential in your existing work",
          "Develop more sophisticated understanding of your project",
          "Find creative ways to enhance project coherence"
        ]
      });
    }

    return opportunities.slice(0, 4); // Return top 4 most relevant opportunities
  }

  /**
   * Generate contextual next steps based on current situation
   */
  generateContextualNextSteps(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult,
    userGoal?: 'explore' | 'develop' | 'organize' | 'complete'
  ): {
    immediateSteps: ActionStep[];
    shortTermGoals: string[];
    strategicConsiderations: string[];
  } {
    const projectState = analysisResult.basket_classification.state;
    const intelligenceLevel = understanding.intelligenceLevel.stage;

    const immediateSteps = this.createImmediateSteps(projectState, intelligenceLevel, userGoal);
    const shortTermGoals = this.createShortTermGoals(understanding, projectState, userGoal);
    const strategicConsiderations = this.createStrategicConsiderations(understanding, analysisResult, userGoal);

    return {
      immediateSteps,
      shortTermGoals,
      strategicConsiderations
    };
  }

  // Private guidance generation methods
  private createDevelopmentGuidance(
    projectState: string,
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): StrategicGuidance[] {
    const guidance: StrategicGuidance[] = [];

    switch (projectState) {
      case 'empty':
        guidance.push({
          title: "Establish Your Project Foundation",
          description: "Begin building the content base that will allow meaningful insights to emerge",
          recommendation: "Start by adding your core ideas, documents, or materials to give me something substantial to understand",
          reasoning: "Every meaningful project needs a foundation of content. The more you share, the better I can understand your vision and provide targeted guidance.",
          actionPlan: [
            {
              step: "Share your first document or idea",
              description: "Upload a file or write about what you're working on",
              userBenefit: "I'll begin understanding your project's direction",
              estimatedTime: "5-10 minutes"
            },
            {
              step: "Add context about your goals",
              description: "Explain what you want to achieve with this project",
              userBenefit: "I can tailor my assistance to your specific objectives",
              estimatedTime: "5 minutes"
            },
            {
              step: "Include any background information",
              description: "Share relevant context, constraints, or requirements",
              userBenefit: "I'll provide more realistic and applicable guidance",
              estimatedTime: "10 minutes"
            }
          ],
          expectedOutcome: "I'll develop initial understanding and can begin offering targeted insights",
          timeframe: 'immediate',
          difficulty: 'beginner_friendly'
        });
        break;

      case 'minimal':
        guidance.push({
          title: "Expand Your Content for Deeper Insights",
          description: "Build on your initial content to develop stronger themes and more meaningful guidance",
          recommendation: "Add 3-5 more pieces of content to help me identify clear patterns and themes in your work",
          reasoning: "With more content, I can move beyond basic understanding to identify meaningful themes and provide strategic insights about your project's direction.",
          actionPlan: [
            {
              step: "Add related documents or ideas",
              description: "Include materials that expand on your initial content",
              userBenefit: "I'll start seeing patterns and themes in your work",
              estimatedTime: "15-20 minutes"
            },
            {
              step: "Provide more detailed thoughts",
              description: "Elaborate on the ideas you've already shared",
              userBenefit: "I'll develop richer understanding of your perspective",
              estimatedTime: "10-15 minutes"
            },
            {
              step: "Connect different aspects",
              description: "Explain how different parts of your project relate",
              userBenefit: "I'll begin understanding your project's structure",
              estimatedTime: "10 minutes"
            }
          ],
          expectedOutcome: "Clear themes will emerge and I can provide thematic insights and strategic guidance",
          timeframe: 'immediate',
          difficulty: 'beginner_friendly'
        });
        break;

      case 'developing':
        guidance.push({
          title: "Strengthen Your Thematic Development",
          description: "Focus on deepening the themes I've identified to create more sophisticated understanding",
          recommendation: "Explore each of your key themes in greater depth and look for interesting connections between them",
          reasoning: "Your project has good thematic foundation. By strengthening these themes, you'll unlock more strategic insights and create a more coherent project.",
          actionPlan: [
            {
              step: "Deepen your strongest theme",
              description: "Add more content that explores your primary theme from different angles",
              userBenefit: "Create rich, nuanced understanding of your main focus",
              estimatedTime: "20-30 minutes"
            },
            {
              step: "Explore theme connections",
              description: "Look for ways your different themes might relate or reinforce each other",
              userBenefit: "Discover the underlying structure of your project",
              estimatedTime: "15-20 minutes"
            },
            {
              step: "Address theme gaps",
              description: "Add content that fills in missing aspects of your themes",
              userBenefit: "Create more complete and balanced thematic development",
              estimatedTime: "15-25 minutes"
            }
          ],
          expectedOutcome: "Sophisticated thematic understanding that enables strategic insights and planning",
          timeframe: 'short_term',
          difficulty: 'moderate_effort'
        });
        break;

      case 'rich':
      case 'complex':
        guidance.push({
          title: "Leverage Strategic Insights for Development",
          description: "Use the comprehensive understanding we've built to make strategic decisions about your project's future",
          recommendation: "Focus on the strategic opportunities I've identified and plan your next development phases",
          reasoning: "With strong thematic development, you can now make strategic decisions about direction, priorities, and opportunities that will maximize your project's impact.",
          actionPlan: [
            {
              step: "Review strategic insights",
              description: "Examine the patterns and opportunities I've identified",
              userBenefit: "Understand your project from a strategic perspective",
              estimatedTime: "15-20 minutes"
            },
            {
              step: "Prioritize development areas",
              description: "Choose which aspects of your project to focus on next",
              userBenefit: "Make informed decisions about resource allocation",
              estimatedTime: "20-30 minutes"
            },
            {
              step: "Plan strategic initiatives",
              description: "Develop specific plans for your highest-priority areas",
              userBenefit: "Create clear roadmap for continued development",
              estimatedTime: "30-45 minutes"
            }
          ],
          expectedOutcome: "Clear strategic direction and actionable plans for maximizing your project's potential",
          timeframe: 'medium_term',
          difficulty: 'advanced_focus'
        });
        break;
    }

    return guidance;
  }

  private createOrganizationGuidance(
    projectState: string,
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): StrategicGuidance[] {
    const guidance: StrategicGuidance[] = [];
    const contentCount = analysisResult.content_analyses.length;

    if (contentCount >= 5) {
      guidance.push({
        title: "Organize Content Around Key Themes",
        description: "Structure your content to highlight the important themes and connections I've identified",
        recommendation: "Group related content together and create clear pathways between connected ideas",
        reasoning: "With substantial content, organization becomes crucial for maintaining clarity and enabling deeper insights. Good organization also makes your project more accessible and actionable.",
        actionPlan: [
          {
            step: "Group content by theme",
            description: "Organize related materials around your key themes",
            userBenefit: "Make your project structure more clear and navigable",
            estimatedTime: "20-30 minutes"
          },
          {
            step: "Create clear connections",
            description: "Establish explicit relationships between related ideas",
            userBenefit: "Help others (and yourself) understand how ideas relate",
            estimatedTime: "15-25 minutes"
          },
          {
            step: "Prioritize core content",
            description: "Identify your most important materials and give them prominence",
            userBenefit: "Ensure key ideas get the attention they deserve",
            estimatedTime: "10-15 minutes"
          }
        ],
        expectedOutcome: "Well-organized project that clearly communicates your themes and supports deeper exploration",
        timeframe: 'short_term',
        difficulty: 'moderate_effort'
      });
    }

    return guidance;
  }

  private createCreativityGuidance(
    intelligenceLevel: string,
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): StrategicGuidance[] {
    const guidance: StrategicGuidance[] = [];

    if (intelligenceLevel === 'insights' || intelligenceLevel === 'deep_knowledge') {
      guidance.push({
        title: "Explore Creative Synthesis Opportunities",
        description: "Use the deep understanding we've developed to discover creative possibilities in your project",
        recommendation: "Look for unexpected connections and novel approaches that emerge from your established themes",
        reasoning: "With strong foundational understanding, you can now safely explore creative territories. The insights I've developed provide a solid base for creative experimentation.",
        actionPlan: [
          {
            step: "Identify synthesis opportunities",
            description: "Look for ways to combine or connect different themes creatively",
            userBenefit: "Discover innovative approaches unique to your project",
            estimatedTime: "20-30 minutes"
          },
          {
            step: "Experiment with new perspectives",
            description: "View your established themes from unexpected angles",
            userBenefit: "Uncover fresh insights and possibilities",
            estimatedTime: "25-35 minutes"
          },
          {
            step: "Develop creative extensions",
            description: "Explore how your themes might evolve in new directions",
            userBenefit: "Expand your project's potential and scope",
            estimatedTime: "30-40 minutes"
          }
        ],
        expectedOutcome: "Creative insights that add unique value and distinguish your project",
        timeframe: 'medium_term',
        difficulty: 'advanced_focus'
      });
    }

    return guidance;
  }

  private createCompletionGuidance(
    projectState: string,
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): StrategicGuidance[] {
    const guidance: StrategicGuidance[] = [];

    if (projectState === 'rich' || projectState === 'complex') {
      guidance.push({
        title: "Prepare for Project Completion and Impact",
        description: "Transform your well-developed project into something that can be shared, implemented, or used",
        recommendation: "Focus on making your project's value clear and accessible to others who might benefit from it",
        reasoning: "Your project has reached maturity. The focus should shift from development to completion, refinement, and preparation for impact or sharing.",
        actionPlan: [
          {
            step: "Clarify key messages",
            description: "Distill your project's most important insights and findings",
            userBenefit: "Communicate your project's value clearly",
            estimatedTime: "30-45 minutes"
          },
          {
            step: "Create accessible summaries",
            description: "Develop materials that help others understand your work",
            userBenefit: "Make your project's benefits available to broader audience",
            estimatedTime: "45-60 minutes"
          },
          {
            step: "Plan implementation steps",
            description: "Define how your project's insights can be put into action",
            userBenefit: "Transform understanding into practical impact",
            estimatedTime: "30-45 minutes"
          }
        ],
        expectedOutcome: "Completed project ready for sharing, implementation, or practical application",
        timeframe: 'long_term',
        difficulty: 'advanced_focus'
      });
    }

    return guidance;
  }

  private priorityWeight(importance: DevelopmentPriority['importance']): number {
    switch (importance) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 5;
    }
  }

  private assessOverallHealth(
    projectState: string,
    contentCount: number,
    themeCount: number,
    confidenceLevel: string
  ): ProjectHealthAssessment['overallHealth'] {
    if (projectState === 'complex' && themeCount >= 3) return 'excellent';
    if (projectState === 'rich' && themeCount >= 2) return 'good';
    if (projectState === 'developing' && contentCount >= 3) return 'developing';
    return 'needs_attention';
  }

  private identifyProjectStrengths(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): string[] {
    const strengths: string[] = [];
    const themeCount = understanding.discoveredThemes.length;
    const contentCount = analysisResult.content_analyses.length;
    const projectState = analysisResult.basket_classification.state;

    if (themeCount >= 3) strengths.push("Rich thematic development with multiple strong themes");
    if (contentCount >= 8) strengths.push("Substantial content base providing solid foundation");
    if (projectState === 'rich' || projectState === 'complex') strengths.push("Mature project development with clear direction");
    if (understanding.confidence.level === 'comprehensive_knowledge') strengths.push("Deep AI understanding enabling strategic insights");
    if (analysisResult.relationship_analysis?.document_connections.length > 5) strengths.push("Strong content relationships creating project coherence");

    return strengths.length > 0 ? strengths : ["Good foundation for continued development"];
  }

  private identifyImprovementAreas(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult
  ): string[] {
    const improvements: string[] = [];
    const themeCount = understanding.discoveredThemes.length;
    const contentCount = analysisResult.content_analyses.length;
    const projectState = analysisResult.basket_classification.state;

    if (contentCount < 5) improvements.push("Content foundation could be strengthened with additional materials");
    if (themeCount === 0) improvements.push("Theme development needs attention to create clearer focus");
    if (projectState === 'minimal') improvements.push("Overall project development requires more substantial content");
    if (!analysisResult.relationship_analysis) improvements.push("Content relationships could be strengthened through better connections");
    if (understanding.confidence.level === 'just_getting_started') improvements.push("AI understanding needs more content to provide meaningful insights");

    return improvements.length > 0 ? improvements : ["Continue building on your strong foundation"];
  }

  private generateHealthRecommendations(
    strengths: string[],
    improvements: string[],
    projectState: string
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Based on improvement areas
    improvements.forEach(improvement => {
      if (improvement.includes('content foundation')) {
        recommendations.push({
          focus: "Content Development",
          suggestion: "Add 3-5 more documents or detailed ideas to strengthen your foundation",
          impact: 'high',
          effort: 'moderate'
        });
      }
      if (improvement.includes('theme development')) {
        recommendations.push({
          focus: "Theme Clarity",
          suggestion: "Focus your content around 2-3 clear themes to create stronger direction",
          impact: 'high',
          effort: 'moderate'
        });
      }
      if (improvement.includes('relationships')) {
        recommendations.push({
          focus: "Content Connection",
          suggestion: "Explicitly connect related ideas to improve project coherence",
          impact: 'medium',
          effort: 'minimal'
        });
      }
    });

    // Based on project state
    if (projectState === 'rich' || projectState === 'complex') {
      recommendations.push({
        focus: "Strategic Planning",
        suggestion: "Leverage your mature development for strategic planning and next steps",
        impact: 'high',
        effort: 'significant'
      });
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  private assessProgressTrajectory(
    analysisResult: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): ProjectHealthAssessment['progressTrajectory'] {
    if (!previousAnalysis) return 'steady';

    const currentContent = analysisResult.content_analyses.length;
    const previousContent = previousAnalysis.content_analyses.length;
    const currentState = analysisResult.basket_classification.state;
    const previousState = previousAnalysis.basket_classification.state;

    // Check for state progression
    const stateProgression = this.getStateOrder(currentState) - this.getStateOrder(previousState);
    
    // Check for content growth
    const contentGrowth = currentContent - previousContent;

    if (stateProgression > 0 || contentGrowth >= 3) return 'accelerating';
    if (contentGrowth >= 1 || stateProgression === 0) return 'steady';
    if (contentGrowth === 0 && stateProgression === 0) return 'stalled';
    return 'slowing';
  }

  private getStateOrder(state: string): number {
    switch (state) {
      case 'empty': return 0;
      case 'minimal': return 1;
      case 'developing': return 2;
      case 'rich': return 3;
      case 'complex': return 4;
      default: return 0;
    }
  }

  private createImmediateSteps(
    projectState: string,
    intelligenceLevel: string,
    userGoal?: string
  ): ActionStep[] {
    const steps: ActionStep[] = [];

    switch (projectState) {
      case 'empty':
        steps.push({
          step: "Add your first content",
          description: "Share a document, idea, or material to begin building understanding",
          userBenefit: "I'll start learning about your project and can provide initial guidance",
          estimatedTime: "10-15 minutes"
        });
        break;

      case 'minimal':
        steps.push({
          step: "Expand with related content",
          description: "Add 2-3 more pieces that build on what you've already shared",
          userBenefit: "Enable theme identification and more targeted insights",
          estimatedTime: "20-30 minutes"
        });
        break;

      case 'developing':
        if (userGoal === 'organize') {
          steps.push({
            step: "Group content by theme",
            description: "Organize your materials around the themes I've identified",
            userBenefit: "Create clearer structure and improved navigation",
            estimatedTime: "15-25 minutes"
          });
        } else {
          steps.push({
            step: "Deepen your strongest theme",
            description: "Add more content that explores your primary theme in greater detail",
            userBenefit: "Develop richer understanding and unlock strategic insights",
            estimatedTime: "20-30 minutes"
          });
        }
        break;

      case 'rich':
      case 'complex':
        if (userGoal === 'complete') {
          steps.push({
            step: "Clarify key insights",
            description: "Identify and articulate your project's most important findings",
            userBenefit: "Prepare your work for sharing or implementation",
            estimatedTime: "30-45 minutes"
          });
        } else {
          steps.push({
            step: "Explore strategic opportunities",
            description: "Review the insights I've developed for strategic possibilities",
            userBenefit: "Identify high-impact directions for continued development",
            estimatedTime: "20-30 minutes"
          });
        }
        break;
    }

    return steps;
  }

  private createShortTermGoals(
    understanding: ProjectUnderstanding,
    projectState: string,
    userGoal?: string
  ): string[] {
    const goals: string[] = [];

    switch (projectState) {
      case 'empty':
        goals.push(
          "Establish 3-5 pieces of foundational content",
          "Develop initial themes and direction",
          "Create basis for meaningful AI insights"
        );
        break;

      case 'minimal':
        goals.push(
          "Identify 2-3 clear project themes",
          "Build content base to 8-10 substantial pieces",
          "Enable strategic guidance and recommendations"
        );
        break;

      case 'developing':
        goals.push(
          "Strengthen thematic development across all themes",
          "Create clear connections between different content areas",
          "Achieve rich project state with sophisticated insights"
        );
        break;

      case 'rich':
      case 'complex':
        if (userGoal === 'complete') {
          goals.push(
            "Prepare project for sharing or implementation",
            "Create clear summaries of key insights",
            "Develop actionable outcomes from your work"
          );
        } else {
          goals.push(
            "Leverage insights for strategic planning",
            "Explore creative synthesis opportunities",
            "Plan next phase development initiatives"
          );
        }
        break;
    }

    return goals;
  }

  private createStrategicConsiderations(
    understanding: ProjectUnderstanding,
    analysisResult: CoordinatedAnalysisResult,
    userGoal?: string
  ): string[] {
    const considerations: string[] = [];
    const projectState = analysisResult.basket_classification.state;
    const themeCount = understanding.discoveredThemes.length;

    // General strategic considerations
    considerations.push("Balance depth and breadth in your content development");
    
    if (themeCount >= 2) {
      considerations.push("Consider how your themes might work together synergistically");
    }

    if (projectState === 'rich' || projectState === 'complex') {
      considerations.push("Think about how to make your insights accessible to others");
      considerations.push("Consider the practical applications of your developed understanding");
    }

    // Goal-specific considerations
    switch (userGoal) {
      case 'explore':
        considerations.push("Remain open to unexpected directions and connections");
        break;
      case 'develop':
        considerations.push("Focus on areas with the highest potential for meaningful growth");
        break;
      case 'organize':
        considerations.push("Structure should serve understanding, not just tidiness");
        break;
      case 'complete':
        considerations.push("Consider your intended audience and how they will use your work");
        break;
    }

    return considerations.slice(0, 4); // Return top 4 considerations
  }
}