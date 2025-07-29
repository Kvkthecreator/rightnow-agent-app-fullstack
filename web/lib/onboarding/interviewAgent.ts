import { fetchWithToken } from "@/lib/fetchWithToken";
import { InterviewResponse, BusinessContext, WorkspaceCreationPlan } from "@/components/onboarding/OnboardingAgent";

// Agent configuration for intelligent interview processing
export interface OnboardingAgentConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

export interface AgentProcessingResult {
  success: boolean;
  plan?: WorkspaceCreationPlan;
  insights?: InterviewInsights;
  error?: string;
}

export interface InterviewInsights {
  businessTypeConfidence: number;
  challengeComplexity: 'simple' | 'moderate' | 'complex';
  recommendedApproach: string;
  intelligenceSeeds: {
    keyThemes: string[];
    riskFactors: string[];
    opportunityAreas: string[];
  };
}

const DEFAULT_AGENT_CONFIG: OnboardingAgentConfig = {
  model: "claude-3-sonnet-20240229",
  temperature: 0.3,
  max_tokens: 4000,
  system_prompt: `You are an expert business analyst and workspace architect. Your role is to analyze user interview responses and generate intelligent workspace creation plans.

Key responsibilities:
1. Analyze business context and challenges with precision
2. Identify thematic patterns and intelligence opportunities  
3. Generate contextually relevant document structures
4. Seed intelligence systems with meaningful starting points
5. Ensure workspace plans are immediately valuable and actionable

Analysis Framework:
- Business Type Recognition: Classify business type with confidence scoring
- Challenge Analysis: Assess complexity and required approach  
- Stakeholder Mapping: Identify key relationships and influence patterns
- Success Pattern Recognition: Match against proven frameworks
- Intelligence Seeding: Identify themes, patterns, and connections for AI systems

Output Quality Standards:
- Workspace names should be specific and meaningful
- Document types should match actual business needs
- Intelligence seeds should enable immediate useful analysis
- Context items should have clear relevance scoring
- Plans should feel custom-tailored, not templated

You must respond with structured JSON that follows the WorkspaceCreationPlan interface.`
};

export class OnboardingAgent {
  private config: OnboardingAgentConfig;
  private processingHistory: Map<string, AgentProcessingResult> = new Map();

  constructor(config?: Partial<OnboardingAgentConfig>) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
  }

  async processInterview(
    responses: InterviewResponse[],
    businessContext: BusinessContext
  ): Promise<AgentProcessingResult> {
    
    const sessionId = this.generateSessionId(responses, businessContext);
    
    // Check if we've already processed this exact interview
    if (this.processingHistory.has(sessionId)) {
      return this.processingHistory.get(sessionId)!;
    }

    try {
      // Prepare agent input
      const agentInput = this.prepareAgentInput(responses, businessContext);
      
      // Call the agent processing endpoint
      const agentResponse = await this.callAgent(agentInput);
      
      // Process and validate the agent response
      const result = await this.processAgentResponse(agentResponse, businessContext);
      
      // Cache the result
      this.processingHistory.set(sessionId, result);
      
      return result;

    } catch (error) {
      console.error('Agent processing failed:', error);
      
      const errorResult: AgentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown agent processing error'
      };
      
      return errorResult;
    }
  }

  private generateSessionId(responses: InterviewResponse[], context: BusinessContext): string {
    const contextHash = Buffer.from(
      JSON.stringify({ responses, context })
    ).toString('base64').substring(0, 16);
    
    return `session_${Date.now()}_${contextHash}`;
  }

  private prepareAgentInput(responses: InterviewResponse[], context: BusinessContext) {
    return {
      interview_data: {
        responses: responses.map(r => ({
          question_id: r.questionId,
          question_text: r.question,
          user_response: r.response,
          response_quality: 'medium',
          timestamp: r.timestamp
        })),
        business_context: {
          business_type: context.businessType,
          primary_challenge: context.challenge,
          success_criteria: context.successCriteria,
          key_stakeholders: context.stakeholders,
          existing_information: context.existingInfo,
          interview_completion_time: Date.now()
        }
      },
      processing_requirements: {
        workspace_personalization: 'high',
        intelligence_seeding: 'comprehensive', 
        document_specificity: 'business_relevant',
        immediate_value: 'required'
      },
      output_format: 'workspace_creation_plan'
    };
  }

  private async callAgent(input: any): Promise<any> {
    const response = await fetchWithToken('/api/agent-run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent: 'onboarding_workspace_architect',
        input: input,
        config: {
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.max_tokens,
          system_prompt: this.config.system_prompt
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Agent call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async processAgentResponse(
    agentResponse: any, 
    originalContext: BusinessContext
  ): Promise<AgentProcessingResult> {
    
    try {
      // Extract the plan from agent response
      const agentPlan = agentResponse.output || agentResponse.result || agentResponse;
      
      // Validate the plan structure
      if (!this.validatePlanStructure(agentPlan)) {
        throw new Error('Agent returned invalid plan structure');
      }

      // Enhance plan with additional intelligence
      const enhancedPlan = await this.enhancePlan(agentPlan, originalContext);
      
      // Generate insights
      const insights = this.generateInsights(agentPlan, originalContext);

      return {
        success: true,
        plan: enhancedPlan,
        insights: insights
      };

    } catch (error) {
      console.error('Agent response processing failed:', error);
      
      return {
        success: false,
        error: `Failed to process agent response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private validatePlanStructure(plan: any): boolean {
    const requiredFields = [
      'basketName',
      'basketDescription', 
      'documents',
      'contextItems',
      'intelligenceSeeds'
    ];

    return requiredFields.every(field => {
      const hasField = plan && typeof plan === 'object' && plan[field] !== undefined;
      if (!hasField) {
        console.warn(`Missing required field in agent plan: ${field}`);
      }
      return hasField;
    });
  }

  private async enhancePlan(
    agentPlan: any,
    context: BusinessContext
  ): Promise<WorkspaceCreationPlan> {
    
    // Ensure documents have proper structure
    const enhancedDocuments = agentPlan.documents.map((doc: any) => ({
      title: doc.title || 'Untitled Document',
      type: doc.type || 'strategy',
      initialContent: doc.initialContent || this.generateFallbackContent(doc, context),
      suggestedBlocks: Array.isArray(doc.suggestedBlocks) ? doc.suggestedBlocks : []
    }));

    // Enhance intelligence seeds
    const enhancedIntelligenceSeeds = {
      themes: Array.isArray(agentPlan.intelligenceSeeds?.themes) ? 
        agentPlan.intelligenceSeeds.themes : 
        this.generateFallbackThemes(context),
      patterns: Array.isArray(agentPlan.intelligenceSeeds?.patterns) ?
        agentPlan.intelligenceSeeds.patterns :
        this.generateFallbackPatterns(context),
      connections: Array.isArray(agentPlan.intelligenceSeeds?.connections) ?
        agentPlan.intelligenceSeeds.connections :
        this.generateFallbackConnections(context)
    };

    // Enhance context items
    const enhancedContextItems = Array.isArray(agentPlan.contextItems) ?
      agentPlan.contextItems :
      this.generateFallbackContextItems(context);

    return {
      basketName: agentPlan.basketName || `${context.businessType} Project`,
      basketDescription: agentPlan.basketDescription || this.generateFallbackDescription(context),
      documents: enhancedDocuments,
      contextItems: enhancedContextItems,
      intelligenceSeeds: enhancedIntelligenceSeeds
    };
  }

  private generateFallbackContent(doc: any, context: BusinessContext): string {
    return `# ${doc.title || 'Project Overview'}\n\n## Challenge\n${context.challenge}\n\n## Success Criteria\n${context.successCriteria}\n\n## Key Stakeholders\n${context.stakeholders}`;
  }

  private generateFallbackThemes(context: BusinessContext): string[] {
    return ['business-strategy', 'stakeholder-alignment', 'success-metrics'];
  }

  private generateFallbackPatterns(context: BusinessContext): string[] {
    return ['project-planning', 'stakeholder-engagement', 'success-tracking'];
  }

  private generateFallbackConnections(context: BusinessContext): string[] {
    return [`business-${context.businessType}`, 'stakeholder-success', 'challenge-solution'];
  }

  private generateFallbackContextItems(context: BusinessContext) {
    return [
      {
        type: 'business_context',
        content: context.businessType,
        relevance: 0.9
      },
      {
        type: 'success_criteria',
        content: context.successCriteria,
        relevance: 0.8
      }
    ];
  }

  private generateFallbackDescription(context: BusinessContext): string {
    return `Intelligent workspace for ${context.challenge.toLowerCase()}. Focused on achieving ${context.successCriteria.toLowerCase()} for ${context.stakeholders.toLowerCase()}.`;
  }

  private generateInsights(plan: any, context: BusinessContext): InterviewInsights {
    // Analyze business type confidence based on context clues
    const businessTypeConfidence = this.calculateBusinessTypeConfidence(context);
    
    // Assess challenge complexity
    const challengeComplexity = this.assessChallengeComplexity(context);
    
    // Generate recommended approach
    const recommendedApproach = this.generateRecommendedApproach(context, challengeComplexity);
    
    // Extract intelligence seeds
    const intelligenceSeeds = {
      keyThemes: plan.intelligenceSeeds?.themes?.slice(0, 3) || [],
      riskFactors: this.identifyRiskFactors(context),
      opportunityAreas: this.identifyOpportunities(context)
    };

    return {
      businessTypeConfidence,
      challengeComplexity,
      recommendedApproach,
      intelligenceSeeds
    };
  }

  private calculateBusinessTypeConfidence(context: BusinessContext): number {
    const businessType = context.businessType.toLowerCase();
    const challenge = context.challenge.toLowerCase();
    
    // Simple heuristic for confidence scoring
    const specificTerms = ['startup', 'consulting', 'retail', 'technology', 'healthcare'];
    const hasSpecificTerm = specificTerms.some(term => businessType.includes(term));
    const challengeAligns = challenge.includes(businessType.split(' ')[0]);
    
    if (hasSpecificTerm && challengeAligns) return 0.9;
    if (hasSpecificTerm) return 0.7;
    return 0.5;
  }

  private assessChallengeComplexity(context: BusinessContext): 'simple' | 'moderate' | 'complex' {
    const challenge = context.challenge.toLowerCase();
    const stakeholders = context.stakeholders.toLowerCase();
    
    const complexityIndicators = [
      'multiple', 'various', 'different', 'complex', 'comprehensive',
      'strategic', 'long-term', 'cross-functional'
    ];
    
    const complexityScore = complexityIndicators.filter(indicator => 
      challenge.includes(indicator) || stakeholders.includes(indicator)
    ).length;
    
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 1) return 'moderate';
    return 'simple';
  }

  private generateRecommendedApproach(
    context: BusinessContext, 
    complexity: 'simple' | 'moderate' | 'complex'
  ): string {
    const approaches = {
      simple: 'Focus on rapid execution and clear deliverables',
      moderate: 'Balance thorough analysis with actionable planning',
      complex: 'Emphasize stakeholder alignment and phased implementation'
    };
    
    return approaches[complexity];
  }

  private identifyRiskFactors(context: BusinessContext): string[] {
    const risks = [];
    const challenge = context.challenge.toLowerCase();
    
    if (challenge.includes('time') || challenge.includes('deadline')) {
      risks.push('timeline-pressure');
    }
    if (challenge.includes('budget') || challenge.includes('cost')) {
      risks.push('resource-constraints');
    }
    if (challenge.includes('stakeholder') || challenge.includes('team')) {
      risks.push('stakeholder-alignment');
    }
    
    return risks.slice(0, 3);
  }

  private identifyOpportunities(context: BusinessContext): string[] {
    const opportunities = [];
    const successCriteria = context.successCriteria.toLowerCase();
    
    if (successCriteria.includes('growth') || successCriteria.includes('increase')) {
      opportunities.push('growth-acceleration');
    }
    if (successCriteria.includes('efficiency') || successCriteria.includes('optimize')) {
      opportunities.push('process-optimization');
    }
    if (successCriteria.includes('innovation') || successCriteria.includes('new')) {
      opportunities.push('innovation-leverage');
    }
    
    return opportunities.slice(0, 3);
  }

  // Public method to get processing history
  getProcessingHistory(): Map<string, AgentProcessingResult> {
    return new Map(this.processingHistory);
  }

  // Clear processing cache
  clearCache(): void {
    this.processingHistory.clear();
  }
}

// Global instance for use across the application
export const globalOnboardingAgent = new OnboardingAgent();