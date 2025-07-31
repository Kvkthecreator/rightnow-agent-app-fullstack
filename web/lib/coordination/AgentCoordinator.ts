/**
 * Agent Layer Bridge and Coordination
 * 
 * This coordinator manages the interaction between infrastructure agents (technical)
 * and narrative agents (user-facing). It ensures clean separation while enabling
 * sophisticated AI assistance.
 * 
 * CRITICAL: This coordinates between technical substrate and narrative presentation.
 * It must never leak technical substrate vocabulary to user-facing outputs.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Infrastructure agents
import { BasketAnalysisAgent } from '../infrastructure/BasketAnalysisAgent';
import { ContentProcessingAgent } from '../infrastructure/ContentProcessingAgent';
import { DataCoordinationAgent, AnalysisWorkflowRequest } from '../infrastructure/DataCoordinationAgent';

// Narrative agents
import { ProjectUnderstandingAgent, ProjectUnderstanding, ProjectInsight, LearningProgress } from '../narrative/ProjectUnderstandingAgent';
import { AIAssistantAgent, ConversationalResponse, GuidanceRecommendation, ContextualHelp } from '../narrative/AIAssistantAgent';
import { IntelligentGuidanceAgent, StrategicGuidance, DevelopmentPriority, ProjectHealthAssessment, CreativeOpportunity } from '../narrative/IntelligentGuidanceAgent';

// Coordination interfaces
export interface NarrativeIntelligenceRequest {
  basketId: string;
  requestType: 'understanding' | 'conversation' | 'guidance' | 'health_assessment' | 'creative_exploration';
  context?: {
    userQuery?: string;
    userGoal?: 'explore' | 'develop' | 'organize' | 'complete';
    focusArea?: string;
    userContext?: { name?: string; projectType?: string };
  };
  options?: {
    includeInsights?: boolean;
    includeProgress?: boolean;
    cacheResults?: boolean;
    analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  };
}

export interface NarrativeIntelligenceResponse {
  requestId: string;
  basketId: string;
  responseType: NarrativeIntelligenceRequest['requestType'];
  
  // Core narrative responses (always included)
  projectUnderstanding: ProjectUnderstanding;
  
  // Optional responses based on request
  conversationalResponse?: ConversationalResponse;
  strategicGuidance?: StrategicGuidance[];
  healthAssessment?: ProjectHealthAssessment;
  creativeOpportunities?: CreativeOpportunity[];
  contextualHelp?: ContextualHelp;
  
  // Progress and insights
  insights?: ProjectInsight[];
  learningProgress?: LearningProgress;
  
  // Metadata
  processingTime: number;
  intelligenceLevel: string;
  recommendedActions: string[];
}

export interface AgentCoordinationMetrics {
  totalRequests: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  userSatisfactionScore?: number;
  mostCommonRequestTypes: Record<string, number>;
}

/**
 * Agent Coordinator: Bridge Between Technical and Narrative
 * 
 * Coordinates infrastructure agents (technical processing) with narrative agents
 * (user experience) to provide sophisticated AI assistance while maintaining
 * clean separation of concerns.
 */
export class AgentCoordinator {
  private basketAnalysisAgent: BasketAnalysisAgent;
  private contentProcessingAgent: ContentProcessingAgent;
  private dataCoordinationAgent: DataCoordinationAgent;
  
  private projectUnderstandingAgent: ProjectUnderstandingAgent;
  private aiAssistantAgent: AIAssistantAgent;
  private intelligentGuidanceAgent: IntelligentGuidanceAgent;
  
  private requestCounter = 0;
  private metrics: Partial<AgentCoordinationMetrics> = {
    totalRequests: 0,
    mostCommonRequestTypes: {}
  };

  constructor(supabase: SupabaseClient) {
    // Initialize infrastructure agents
    this.basketAnalysisAgent = new BasketAnalysisAgent(supabase);
    this.contentProcessingAgent = new ContentProcessingAgent();
    this.dataCoordinationAgent = new DataCoordinationAgent(
      this.basketAnalysisAgent,
      this.contentProcessingAgent
    );
    
    // Initialize narrative agents
    this.projectUnderstandingAgent = new ProjectUnderstandingAgent();
    this.aiAssistantAgent = new AIAssistantAgent();
    this.intelligentGuidanceAgent = new IntelligentGuidanceAgent();
  }

  /**
   * Main coordination method: Process narrative intelligence request
   */
  async processNarrativeIntelligence(
    request: NarrativeIntelligenceRequest
  ): Promise<NarrativeIntelligenceResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Update metrics
      this.updateRequestMetrics(request.requestType);
      
      // Step 1: Execute technical analysis via infrastructure agents
      const technicalAnalysis = await this.executeTechnicalAnalysis(request);
      
      // Step 2: Transform to narrative understanding via narrative agents
      const narrativeResponse = await this.createNarrativeResponse(
        request,
        technicalAnalysis,
        requestId
      );
      
      // Step 3: Calculate processing time and finalize response
      const processingTime = Date.now() - startTime;
      return {
        ...narrativeResponse,
        processingTime
      };
      
    } catch (error) {
      console.error('Agent coordination error:', error);
      return this.createErrorResponse(request, requestId, Date.now() - startTime);
    }
  }

  /**
   * Batch process multiple requests for efficiency
   */
  async processBatchRequests(
    requests: NarrativeIntelligenceRequest[]
  ): Promise<NarrativeIntelligenceResponse[]> {
    // Group requests by basket ID for efficient technical analysis
    const requestsByBasket = this.groupRequestsByBasket(requests);
    
    const responses: NarrativeIntelligenceResponse[] = [];
    
    // Process each basket's requests together
    for (const [basketId, basketRequests] of requestsByBasket.entries()) {
      // Execute technical analysis once per basket
      const technicalAnalysis = await this.executeTechnicalAnalysis(basketRequests[0]);
      
      // Create narrative responses for all requests for this basket
      for (const request of basketRequests) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        const narrativeResponse = await this.createNarrativeResponse(
          request,
          technicalAnalysis,
          requestId
        );
        
        responses.push({
          ...narrativeResponse,
          processingTime: Date.now() - startTime
        });
      }
    }
    
    return responses;
  }

  /**
   * Get coordination metrics and performance data
   */
  getCoordinationMetrics(): AgentCoordinationMetrics {
    return {
      totalRequests: this.metrics.totalRequests || 0,
      averageProcessingTime: 0, // Would track this in production
      cacheHitRate: this.dataCoordinationAgent.getProcessingStatistics().cache_stats.cache_hit_rate,
      mostCommonRequestTypes: this.metrics.mostCommonRequestTypes || {}
    };
  }

  /**
   * Clear coordination cache and reset metrics
   */
  resetCoordination(): void {
    this.dataCoordinationAgent.clearAllCache();
    this.requestCounter = 0;
    this.metrics = {
      totalRequests: 0,
      mostCommonRequestTypes: {}
    };
  }

  // Private coordination methods

  /**
   * Execute technical analysis using infrastructure agents
   */
  private async executeTechnicalAnalysis(request: NarrativeIntelligenceRequest) {
    const workflowRequest: AnalysisWorkflowRequest = {
      basket_id: request.basketId,
      analysis_depth: request.options?.analysisDepth || 'standard',
      include_relationships: request.requestType === 'guidance' || request.requestType === 'creative_exploration',
      include_themes: true,
      include_content_extraction: true,
      cache_results: request.options?.cacheResults !== false
    };

    return await this.dataCoordinationAgent.executeAnalysisWorkflow(workflowRequest);
  }

  /**
   * Transform technical analysis into narrative response
   */
  private async createNarrativeResponse(
    request: NarrativeIntelligenceRequest,
    technicalAnalysis: any,
    requestId: string
  ): Promise<Omit<NarrativeIntelligenceResponse, 'processingTime'>> {
    // Step 1: Always create project understanding (core narrative)
    const projectUnderstanding = this.projectUnderstandingAgent.createProjectUnderstanding(
      technicalAnalysis,
      request.context?.userContext
    );

    // Step 2: Create response based on request type
    const response: Omit<NarrativeIntelligenceResponse, 'processingTime'> = {
      requestId,
      basketId: request.basketId,
      responseType: request.requestType,
      projectUnderstanding,
      intelligenceLevel: projectUnderstanding.intelligenceLevel.stage,
      recommendedActions: projectUnderstanding.nextSteps.slice(0, 3)
    };

    // Step 3: Add request-specific narrative elements
    switch (request.requestType) {
      case 'conversation':
        response.conversationalResponse = this.aiAssistantAgent.generateConversationalResponse(
          projectUnderstanding,
          request.context?.userQuery
        );
        break;

      case 'guidance':
        response.strategicGuidance = this.intelligentGuidanceAgent.generateStrategicGuidance(
          projectUnderstanding,
          technicalAnalysis,
          request.context?.focusArea as any
        );
        break;

      case 'health_assessment':
        response.healthAssessment = this.intelligentGuidanceAgent.evaluateProjectHealth(
          projectUnderstanding,
          technicalAnalysis
        );
        break;

      case 'creative_exploration':
        response.creativeOpportunities = this.intelligentGuidanceAgent.identifyCreativeOpportunities(
          projectUnderstanding,
          technicalAnalysis
        );
        break;
    }

    // Step 4: Add optional insights and progress if requested
    if (request.options?.includeInsights) {
      response.insights = this.projectUnderstandingAgent.generateProjectInsights(
        technicalAnalysis,
        request.context?.focusArea as any
      );
    }

    if (request.options?.includeProgress) {
      response.learningProgress = this.projectUnderstandingAgent.createLearningProgress(
        technicalAnalysis
      );
    }

    return response;
  }

  /**
   * Create contextual help based on project state and user situation
   */
  async createContextualHelp(
    basketId: string,
    situation: 'empty_project' | 'first_content' | 'building_themes' | 'seeking_connections' | 'strategic_planning'
  ): Promise<ContextualHelp> {
    // Get current project understanding
    const request: NarrativeIntelligenceRequest = {
      basketId,
      requestType: 'understanding',
      options: { analysisDepth: 'basic', cacheResults: true }
    };

    const response = await this.processNarrativeIntelligence(request);
    
    return this.aiAssistantAgent.createContextualHelp(
      situation,
      response.projectUnderstanding
    );
  }

  /**
   * Generate progress encouragement for user motivation
   */
  async generateProgressEncouragement(
    basketId: string,
    recentActivity?: {
      contentAdded: number;
      themesDiscovered: number;
      connectionsFound: number;
    }
  ) {
    const request: NarrativeIntelligenceRequest = {
      basketId,
      requestType: 'understanding',
      options: { includeProgress: true }
    };

    const response = await this.processNarrativeIntelligence(request);
    
    return this.aiAssistantAgent.createProgressEncouragement(
      response.projectUnderstanding,
      recentActivity
    );
  }

  /**
   * Share insights in conversational format
   */
  async shareInsightsConversationally(basketId: string, focusArea?: string) {
    const request: NarrativeIntelligenceRequest = {
      basketId,
      requestType: 'understanding',
      context: { focusArea },
      options: { includeInsights: true }
    };

    const response = await this.processNarrativeIntelligence(request);
    
    if (response.insights) {
      return this.aiAssistantAgent.shareInsightsConversationally(
        response.insights,
        response.projectUnderstanding
      );
    }

    return null;
  }

  // Utility methods
  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}`;
  }

  private updateRequestMetrics(requestType: NarrativeIntelligenceRequest['requestType']): void {
    this.metrics.totalRequests = (this.metrics.totalRequests || 0) + 1;
    
    if (!this.metrics.mostCommonRequestTypes) {
      this.metrics.mostCommonRequestTypes = {};
    }
    
    this.metrics.mostCommonRequestTypes[requestType] = 
      (this.metrics.mostCommonRequestTypes[requestType] || 0) + 1;
  }

  private groupRequestsByBasket(
    requests: NarrativeIntelligenceRequest[]
  ): Map<string, NarrativeIntelligenceRequest[]> {
    const grouped = new Map<string, NarrativeIntelligenceRequest[]>();
    
    for (const request of requests) {
      const existing = grouped.get(request.basketId) || [];
      existing.push(request);
      grouped.set(request.basketId, existing);
    }
    
    return grouped;
  }

  private createErrorResponse(
    request: NarrativeIntelligenceRequest,
    requestId: string,
    processingTime: number
  ): NarrativeIntelligenceResponse {
    // Create minimal fallback response for errors
    return {
      requestId,
      basketId: request.basketId,
      responseType: request.requestType,
      projectUnderstanding: {
        personalizedGreeting: "I'm having trouble understanding your project right now, but I'm ready to help when you share more content.",
        currentUnderstanding: "I need more information to provide meaningful insights about your project.",
        discoveredThemes: [],
        intelligenceLevel: {
          stage: 'learning',
          description: "Ready to learn about your project",
          progressIndicator: "Waiting for content",
          capabilities: ["Ready to analyze", "Eager to understand"]
        },
        nextSteps: [
          "Share some content about your project",
          "Upload a document or write about your ideas", 
          "Tell me about your goals"
        ],
        confidence: {
          level: 'just_getting_started',
          explanation: "I need content to build understanding",
          visualDescription: "Ready to begin learning"
        }
      },
      processingTime,
      intelligenceLevel: 'learning',
      recommendedActions: ["Add content to help me understand your project"]
    };
  }
}

/**
 * Factory function to create agent coordinator with Supabase client
 */
export function createAgentCoordinator(supabase: SupabaseClient): AgentCoordinator {
  return new AgentCoordinator(supabase);
}

/**
 * Utility function to create common narrative intelligence requests
 */
export const NarrativeRequestBuilder = {
  understanding: (basketId: string, userContext?: { name?: string; projectType?: string }): NarrativeIntelligenceRequest => ({
    basketId,
    requestType: 'understanding',
    context: { userContext },
    options: { includeInsights: true, cacheResults: true }
  }),

  conversation: (basketId: string, userQuery: string, userContext?: { name?: string }): NarrativeIntelligenceRequest => ({
    basketId,
    requestType: 'conversation',
    context: { userQuery, userContext },
    options: { cacheResults: true }
  }),

  guidance: (basketId: string, focusArea?: string, userGoal?: 'explore' | 'develop' | 'organize' | 'complete'): NarrativeIntelligenceRequest => ({
    basketId,
    requestType: 'guidance',
    context: { focusArea, userGoal },
    options: { analysisDepth: 'comprehensive', cacheResults: true }
  }),

  healthCheck: (basketId: string): NarrativeIntelligenceRequest => ({
    basketId,
    requestType: 'health_assessment',
    options: { analysisDepth: 'standard', includeProgress: true }
  }),

  creativeExploration: (basketId: string): NarrativeIntelligenceRequest => ({
    basketId,
    requestType: 'creative_exploration',
    options: { analysisDepth: 'comprehensive', includeInsights: true }
  })
};