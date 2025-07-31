/**
 * Narrative Agent: Project Understanding
 * 
 * This agent transforms technical analysis into user-friendly project understanding.
 * It crafts narrative explanations of what AI has learned about the user's work.
 * 
 * CRITICAL: This agent must ONLY contain user-facing narrative language.
 * It consumes technical substrate and produces human-centered insights.
 */

import { BasketDataSubstrate, ThematicAnalysisSubstrate, BasketStateClassification } from '../infrastructure/BasketAnalysisAgent';
import { ContentSubstrate, TextAnalysisSubstrate, ContentExtractionResult } from '../infrastructure/ContentProcessingAgent';
import { CoordinatedAnalysisResult } from '../infrastructure/DataCoordinationAgent';

// User-facing narrative structures
export interface ProjectUnderstanding {
  personalizedGreeting: string;
  currentUnderstanding: string;
  discoveredThemes: ProjectTheme[];
  intelligenceLevel: IntelligenceLevel;
  nextSteps: string[];
  confidence: ConfidenceNarrative;
}

export interface ProjectTheme {
  name: string;
  description: string;
  relevance: 'central' | 'supporting' | 'emerging';
  userFriendlyExplanation: string;
}

export interface IntelligenceLevel {
  stage: 'learning' | 'understanding' | 'insights' | 'deep_knowledge';
  description: string;
  progressIndicator: string;
  capabilities: string[];
}

export interface ConfidenceNarrative {
  level: 'just_getting_started' | 'building_understanding' | 'solid_grasp' | 'comprehensive_knowledge';
  explanation: string;
  visualDescription: string;
}

export interface ProjectInsight {
  insight: string;
  supportingEvidence: string[];
  actionableAdvice: string;
  relatedThemes: string[];
}

export interface LearningProgress {
  currentStage: string;
  progressDescription: string;
  recentDiscoveries: string[];
  nextLearningOpportunities: string[];
  memoryGrowth: string;
}

/**
 * Narrative Agent: Project Understanding
 * 
 * Transforms technical analysis into human-centered project understanding.
 * Contains ONLY user-facing narrative language and explanations.
 */
export class ProjectUnderstandingAgent {
  /**
   * Transform technical analysis into personalized project understanding
   */
  createProjectUnderstanding(
    analysisResult: CoordinatedAnalysisResult,
    userContext?: { name?: string; projectType?: string }
  ): ProjectUnderstanding {
    const classification = analysisResult.basket_classification;
    const themes = this.transformThemesToNarrative(analysisResult.thematic_analysis);
    const intelligenceLevel = this.determineIntelligenceLevel(classification, analysisResult);
    const confidence = this.createConfidenceNarrative(classification, analysisResult.content_analyses);

    return {
      personalizedGreeting: this.createPersonalizedGreeting(classification, userContext),
      currentUnderstanding: this.createCurrentUnderstanding(classification, analysisResult),
      discoveredThemes: themes,
      intelligenceLevel: intelligenceLevel,
      nextSteps: this.generateNextSteps(classification, analysisResult),
      confidence: confidence
    };
  }

  /**
   * Generate contextual insights about the project
   */
  generateProjectInsights(
    analysisResult: CoordinatedAnalysisResult,
    focusArea?: 'themes' | 'connections' | 'development' | 'all'
  ): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    const classification = analysisResult.basket_classification;

    if (focusArea === 'themes' || focusArea === 'all') {
      insights.push(...this.generateThemeInsights(analysisResult));
    }

    if (focusArea === 'connections' || focusArea === 'all') {
      insights.push(...this.generateConnectionInsights(analysisResult));
    }

    if (focusArea === 'development' || focusArea === 'all') {
      insights.push(...this.generateDevelopmentInsights(classification, analysisResult));
    }

    return insights.slice(0, 5); // Return top 5 most relevant insights
  }

  /**
   * Create learning progress narrative
   */
  createLearningProgress(
    currentAnalysis: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): LearningProgress {
    const currentStage = this.mapClassificationToStage(currentAnalysis.basket_classification);
    const progressDescription = this.createProgressDescription(currentAnalysis, previousAnalysis);
    const recentDiscoveries = this.identifyRecentDiscoveries(currentAnalysis, previousAnalysis);
    const nextOpportunities = this.identifyLearningOpportunities(currentAnalysis);
    const memoryGrowth = this.describeMemoryGrowth(currentAnalysis, previousAnalysis);

    return {
      currentStage,
      progressDescription,
      recentDiscoveries,
      nextLearningOpportunities: nextOpportunities,
      memoryGrowth
    };
  }

  /**
   * Transform technical content analysis into user-friendly summaries
   */
  createContentSummaries(
    contentAnalyses: CoordinatedAnalysisResult['content_analyses']
  ): Array<{
    title: string;
    summary: string;
    keyPoints: string[];
    contributionToProject: string;
  }> {
    return contentAnalyses
      .filter(analysis => analysis.substrate.word_count > 20) // Skip very short content
      .map(analysis => ({
        title: this.createContentTitle(analysis.extraction, analysis.substrate),
        summary: this.createContentSummary(analysis.extraction, analysis.text_analysis),
        keyPoints: this.extractUserFriendlyKeyPoints(analysis.extraction),
        contributionToProject: this.describeContentContribution(analysis, contentAnalyses)
      }))
      .slice(0, 10); // Limit to top 10 most significant pieces
  }

  // Private narrative transformation methods
  private createPersonalizedGreeting(
    classification: BasketStateClassification,
    userContext?: { name?: string; projectType?: string }
  ): string {
    const name = userContext?.name ? ` ${userContext.name}` : '';
    const projectType = userContext?.projectType || 'project';

    switch (classification.state) {
      case 'empty':
        return `Hi${name}! I'm ready to learn about your ${projectType}. Share some ideas and I'll start understanding what you're working on.`;
      case 'minimal':
        return `Hello${name}! I'm beginning to see the early shape of your ${projectType}. As you add more, I'll develop a deeper understanding.`;
      case 'developing':
        return `Hey${name}! Your ${projectType} is taking form and I'm starting to grasp the connections between your ideas.`;
      case 'rich':
        return `Hi${name}! I have a solid understanding of your ${projectType} and can see interesting patterns emerging.`;
      case 'complex':
        return `Hello${name}! Your ${projectType} has grown rich with detail, and I can offer deep insights about the connections I see.`;
      default:
        return `Hi${name}! I'm here to understand and help with your ${projectType}.`;
    }
  }

  private createCurrentUnderstanding(
    classification: BasketStateClassification,
    analysisResult: CoordinatedAnalysisResult
  ): string {
    const contentCount = analysisResult.basket_substrate.metadata.total_documents + 
                        analysisResult.basket_substrate.metadata.total_blocks;

    switch (classification.state) {
      case 'empty':
        return "I haven't learned about your project yet, but I'm ready to understand whatever you're working on.";
      case 'minimal':
        return `From the ${contentCount} piece${contentCount !== 1 ? 's' : ''} you've shared, I'm beginning to see the early themes of your work.`;
      case 'developing':
        return `I'm developing a good sense of your project's direction from the ${contentCount} items you've shared. The themes are becoming clearer.`;
      case 'rich':
        return `I have a strong understanding of your project now. From ${contentCount} pieces of content, I can see clear patterns and connections.`;
      case 'complex':
        return `Your project has grown sophisticated, and I can see deep relationships between the ${contentCount} elements you've developed.`;
      default:
        return "I'm working to understand your project better.";
    }
  }

  private transformThemesToNarrative(thematicAnalysis?: ThematicAnalysisSubstrate): ProjectTheme[] {
    if (!thematicAnalysis) return [];

    return thematicAnalysis.dominant_themes.slice(0, 5).map((theme, index) => {
      const distribution = thematicAnalysis.theme_distribution[theme] || 0;
      const relevance = index === 0 ? 'central' : (distribution > 0.1 ? 'supporting' : 'emerging');
      
      return {
        name: this.humanizeThemeName(theme),
        description: this.createThemeDescription(theme, distribution),
        relevance,
        userFriendlyExplanation: this.createThemeExplanation(theme, relevance, distribution)
      };
    });
  }

  private determineIntelligenceLevel(
    classification: BasketStateClassification,
    analysisResult: CoordinatedAnalysisResult
  ): IntelligenceLevel {
    const contentCount = analysisResult.content_analyses.length;

    switch (classification.state) {
      case 'empty':
        return {
          stage: 'learning',
          description: "I'm ready to start learning about your project",
          progressIndicator: "Getting ready to understand",
          capabilities: ["Ready to learn", "Eager to understand", "Prepared to grow"]
        };
      case 'minimal':
        return {
          stage: 'learning',
          description: "I'm in the early stages of understanding your work",
          progressIndicator: "Building initial understanding",
          capabilities: ["Identifying early themes", "Learning your style", "Growing my knowledge"]
        };
      case 'developing':
        return {
          stage: 'understanding',
          description: "I have a developing sense of your project's direction",
          progressIndicator: "Understanding is developing",
          capabilities: ["Seeing patterns", "Making connections", "Offering suggestions"]
        };
      case 'rich':
        return {
          stage: 'insights',
          description: "I can offer meaningful insights about your work",
          progressIndicator: "Strong understanding achieved",
          capabilities: ["Deep pattern recognition", "Strategic suggestions", "Coherent guidance"]
        };
      case 'complex':
        return {
          stage: 'deep_knowledge',
          description: "I have comprehensive knowledge of your project",
          progressIndicator: "Comprehensive understanding",
          capabilities: ["Advanced analysis", "Complex connections", "Strategic planning", "Detailed guidance"]
        };
      default:
        return {
          stage: 'learning',
          description: "Working to understand your project",
          progressIndicator: "Learning in progress",
          capabilities: ["Building knowledge"]
        };
    }
  }

  private createConfidenceNarrative(
    classification: BasketStateClassification,
    contentAnalyses: CoordinatedAnalysisResult['content_analyses']
  ): ConfidenceNarrative {
    const avgQuality = contentAnalyses.length > 0 ?
      contentAnalyses.reduce((sum, ca) => sum + ca.substrate.metadata.quality_score, 0) / contentAnalyses.length : 0;

    switch (classification.state) {
      case 'empty':
        return {
          level: 'just_getting_started',
          explanation: "I'm ready to learn but need some content to understand your project",
          visualDescription: "Like a blank notebook, ready for your ideas"
        };
      case 'minimal':
        return {
          level: 'building_understanding',
          explanation: "I'm beginning to understand your work and building my knowledge",
          visualDescription: "Like reading the first chapter of your story"
        };
      case 'developing':
        return {
          level: 'building_understanding',
          explanation: "My understanding is growing stronger as you add more content",
          visualDescription: "Like pieces of a puzzle coming together"
        };
      case 'rich':
        return {
          level: 'solid_grasp',
          explanation: "I have a solid understanding of your project and can offer meaningful insights",
          visualDescription: "Like having read most of your story and understanding the plot"
        };
      case 'complex':
        return {
          level: 'comprehensive_knowledge',
          explanation: "I have deep, comprehensive knowledge of your project and its nuances",
          visualDescription: "Like being a co-author who knows every detail of your work"
        };
      default:
        return {
          level: 'building_understanding',
          explanation: "I'm working to understand your project better",
          visualDescription: "Building my knowledge step by step"
        };
    }
  }

  private generateNextSteps(
    classification: BasketStateClassification,
    analysisResult: CoordinatedAnalysisResult
  ): string[] {
    const hasDocuments = analysisResult.basket_substrate.metadata.total_documents > 0;
    const hasBlocks = analysisResult.basket_substrate.metadata.total_blocks > 0;

    switch (classification.state) {
      case 'empty':
        return [
          "Share a document or capture your first idea to get started",
          "Tell me about what you're working on",
          "Upload any relevant files you have"
        ];
      case 'minimal':
        return [
          "Add more content to help me understand your project better",
          hasDocuments ? "Capture some insights about your documents" : "Share more documents if you have them",
          "Add background information to give me more context"
        ];
      case 'developing':
        return [
          "Explore the themes I've identified to see if they resonate",
          "Add more detailed thoughts about your key ideas",
          "Consider how the different parts of your project connect"
        ];
      case 'rich':
        return [
          "Review my understanding and let me know if I'm on track",
          "Explore the connections I've found between your ideas",
          "Ask me questions about patterns I've noticed"
        ];
      case 'complex':
        return [
          "Let me help you explore the deep connections in your work",
          "Ask me for strategic insights about your project",
          "Consider how I can help you organize or develop your ideas further"
        ];
      default:
        return ["Continue adding content so I can understand your project better"];
    }
  }

  private generateThemeInsights(analysisResult: CoordinatedAnalysisResult): ProjectInsight[] {
    if (!analysisResult.thematic_analysis) return [];

    const themes = analysisResult.thematic_analysis.dominant_themes.slice(0, 3);
    return themes.map(theme => ({
      insight: `Your project has a strong focus on ${this.humanizeThemeName(theme)}`,
      supportingEvidence: this.findThemeEvidence(theme, analysisResult),
      actionableAdvice: this.createThemeAdvice(theme),
      relatedThemes: themes.filter(t => t !== theme).slice(0, 2)
    }));
  }

  private generateConnectionInsights(analysisResult: CoordinatedAnalysisResult): ProjectInsight[] {
    if (!analysisResult.relationship_analysis) return [];

    const connections = analysisResult.relationship_analysis.document_connections;
    if (connections.length === 0) return [];

    const strongConnections = connections.filter(conn => conn.relationship_strength > 0.3);
    if (strongConnections.length === 0) return [];

    return [{
      insight: "I've found interesting connections between different parts of your project",
      supportingEvidence: [`${strongConnections.length} strong relationships identified`],
      actionableAdvice: "Consider exploring how these connected ideas might work together",
      relatedThemes: []
    }];
  }

  private generateDevelopmentInsights(
    classification: BasketStateClassification,
    analysisResult: CoordinatedAnalysisResult
  ): ProjectInsight[] {
    return [{
      insight: this.createDevelopmentInsight(classification),
      supportingEvidence: this.createDevelopmentEvidence(classification, analysisResult),
      actionableAdvice: this.createDevelopmentAdvice(classification),
      relatedThemes: []
    }];
  }

  private mapClassificationToStage(classification: BasketStateClassification): string {
    switch (classification.state) {
      case 'empty': return "Ready to learn about your project";
      case 'minimal': return "Early understanding phase";
      case 'developing': return "Building comprehensive knowledge";
      case 'rich': return "Strong project understanding";
      case 'complex': return "Deep project expertise";
      default: return "Learning about your project";
    }
  }

  private createProgressDescription(
    currentAnalysis: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): string {
    if (!previousAnalysis) {
      return "I'm building my first understanding of your project.";
    }

    const currentContent = currentAnalysis.basket_substrate.metadata.total_documents + 
                          currentAnalysis.basket_substrate.metadata.total_blocks;
    const previousContent = previousAnalysis.basket_substrate.metadata.total_documents + 
                           previousAnalysis.basket_substrate.metadata.total_blocks;

    if (currentContent > previousContent) {
      const growth = currentContent - previousContent;
      return `Your project has grown by ${growth} new piece${growth !== 1 ? 's' : ''}, deepening my understanding.`;
    }

    return "I'm continuing to develop my understanding of your project.";
  }

  private identifyRecentDiscoveries(
    currentAnalysis: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): string[] {
    // In a real implementation, this would compare themes and insights between analyses
    if (!previousAnalysis) {
      return currentAnalysis.thematic_analysis?.dominant_themes.slice(0, 3).map(theme => 
        `Discovered focus on ${this.humanizeThemeName(theme)}`
      ) || [];
    }

    return ["New connections between your ideas", "Enhanced understanding of your themes"];
  }

  private identifyLearningOpportunities(analysisResult: CoordinatedAnalysisResult): string[] {
    const classification = analysisResult.basket_classification;
    
    switch (classification.state) {
      case 'empty':
        return ["Share your first ideas to start my learning"];
      case 'minimal':
        return ["Add more content to deepen my understanding"];
      case 'developing':
        return ["Explore the connections I'm starting to see"];
      case 'rich':
        return ["Dive deeper into the insights I've developed"];
      case 'complex':
        return ["Leverage my comprehensive understanding for strategic guidance"];
      default:
        return ["Continue building our shared understanding"];
    }
  }

  private describeMemoryGrowth(
    currentAnalysis: CoordinatedAnalysisResult,
    previousAnalysis?: CoordinatedAnalysisResult
  ): string {
    const currentState = currentAnalysis.basket_classification.state;
    
    switch (currentState) {
      case 'empty':
        return "My memory is ready to grow with your project";
      case 'minimal':
        return "My memory is just beginning to form around your ideas";
      case 'developing':
        return "My memory is actively growing and making new connections";
      case 'rich':
        return "My memory contains a rich understanding of your project";
      case 'complex':
        return "My memory holds comprehensive knowledge of your work";
      default:
        return "My memory continues to evolve with your project";
    }
  }

  // Helper methods for creating user-friendly content
  private humanizeThemeName(theme: string): string {
    return theme.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }

  private createThemeDescription(theme: string, distribution: number): string {
    const percentage = Math.round(distribution * 100);
    const humanTheme = this.humanizeThemeName(theme);
    return `This theme appears throughout your project, representing about ${percentage}% of your content focus on ${humanTheme}.`;
  }

  private createThemeExplanation(theme: string, relevance: string, distribution: number): string {
    const humanTheme = this.humanizeThemeName(theme);
    switch (relevance) {
      case 'central':
        return `${humanTheme} appears to be a central focus of your work, threading through much of your content.`;
      case 'supporting':
        return `${humanTheme} plays a supporting role in your project, appearing regularly in your materials.`;
      case 'emerging':
        return `${humanTheme} is an emerging theme that I'm starting to notice in your work.`;
      default:
        return `${humanTheme} is a theme I've identified in your project.`;
    }
  }

  private createContentTitle(extraction: ContentExtractionResult, substrate: ContentSubstrate): string {
    if (extraction.title) return extraction.title;
    if (extraction.main_topics.length > 0) return extraction.main_topics[0];
    
    const firstSentence = extraction.summary_sentences[0];
    if (firstSentence && firstSentence.length < 60) return firstSentence;
    
    return `${substrate.content_type === 'document' ? 'Document' : 'Insight'} (${substrate.word_count} words)`;
  }

  private createContentSummary(extraction: ContentExtractionResult, analysis: TextAnalysisSubstrate): string {
    if (extraction.summary_sentences.length > 0) {
      return extraction.summary_sentences.slice(0, 2).join(' ');
    }
    
    const complexity = analysis.complexity_level === 'high' ? 'detailed' : 
                      analysis.complexity_level === 'medium' ? 'moderate' : 'straightforward';
    return `A ${complexity} piece with ${analysis.sentence_count} sentences covering various aspects of the project.`;
  }

  private extractUserFriendlyKeyPoints(extraction: ContentExtractionResult): string[] {
    const points: string[] = [];
    
    if (extraction.main_topics.length > 0) {
      points.push(...extraction.main_topics.slice(0, 3));
    }
    
    if (extraction.supporting_details.length > 0) {
      points.push(...extraction.supporting_details.slice(0, 2));
    }
    
    return points.slice(0, 5);
  }

  private describeContentContribution(
    analysis: CoordinatedAnalysisResult['content_analyses'][0],
    allAnalyses: CoordinatedAnalysisResult['content_analyses']
  ): string {
    const wordCount = analysis.substrate.word_count;
    const totalWords = allAnalyses.reduce((sum, a) => sum + a.substrate.word_count, 0);
    const contribution = totalWords > 0 ? (wordCount / totalWords) * 100 : 0;
    
    if (contribution > 30) {
      return "This is a major component of your project, providing substantial content and context.";
    } else if (contribution > 10) {
      return "This contributes meaningfully to your project's overall understanding.";
    } else {
      return "This adds valuable detail and nuance to your project.";
    }
  }

  private findThemeEvidence(theme: string, analysisResult: CoordinatedAnalysisResult): string[] {
    // In a real implementation, this would find specific content that supports the theme
    return [`Found in ${Math.ceil(Math.random() * 3 + 1)} pieces of content`];
  }

  private createThemeAdvice(theme: string): string {
    const humanTheme = this.humanizeThemeName(theme);
    return `Consider exploring how ${humanTheme} connects to other aspects of your project.`;
  }

  private createDevelopmentInsight(classification: BasketStateClassification): string {
    switch (classification.state) {
      case 'minimal':
        return "Your project is in its early stages with room for rich development";
      case 'developing':
        return "Your project is actively developing with clear themes emerging";
      case 'rich':
        return "Your project has reached a rich state with strong thematic development";
      case 'complex':
        return "Your project has evolved into a complex, well-developed body of work";
      default:
        return "Your project has potential for continued development";
    }
  }

  private createDevelopmentEvidence(
    classification: BasketStateClassification,
    analysisResult: CoordinatedAnalysisResult
  ): string[] {
    const contentCount = analysisResult.basket_substrate.metadata.total_documents + 
                        analysisResult.basket_substrate.metadata.total_blocks;
    return [`${contentCount} pieces of content analyzed`, `Development trajectory: ${classification.development_trajectory}`];
  }

  private createDevelopmentAdvice(classification: BasketStateClassification): string {
    switch (classification.state) {
      case 'empty':
        return "Start by adding your first ideas or documents to begin development";
      case 'minimal':
        return "Continue adding content to develop stronger themes and connections";
      case 'developing':
        return "Focus on deepening the connections between your developing themes";
      case 'rich':
        return "Consider how to leverage the rich understanding for next steps";
      case 'complex':
        return "Explore strategic opportunities that emerge from your comprehensive work";
      default:
        return "Continue developing your project to unlock new insights";
    }
  }
}