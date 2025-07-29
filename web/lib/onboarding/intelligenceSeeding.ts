import { fetchWithToken } from "@/lib/fetchWithToken";
import { WorkspaceCreationPlan, BusinessContext } from "@/components/onboarding/OnboardingAgent";

// Intelligence seeding service for onboarding workspaces
export interface IntelligenceSeedException {
  basket_id: string;
  intelligence_type: 'themes' | 'patterns' | 'connections' | 'context' | 'brain';
  data: any;
  confidence: number;
  metadata: Record<string, any>;
}

export interface IntelligenceSeedingResult {
  themes_seeded: boolean;
  patterns_seeded: boolean;
  connections_seeded: boolean;
  context_seeded: boolean;
  brain_initialized: boolean;
  total_seeds: number;
  errors: string[];
}

export class IntelligenceSeedingService {
  private baseUrl: string;
  private seedingHistory: Map<string, IntelligenceSeedingResult> = new Map();

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async seedWorkspaceIntelligence(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext
  ): Promise<IntelligenceSeedingResult> {
    
    const result: IntelligenceSeedingResult = {
      themes_seeded: false,
      patterns_seeded: false,
      connections_seeded: false,
      context_seeded: false,
      brain_initialized: false,
      total_seeds: 0,
      errors: []
    };

    try {
      // Seed thematic intelligence
      result.themes_seeded = await this.seedThemes(basketId, plan, context, result);
      
      // Seed pattern recognition
      result.patterns_seeded = await this.seedPatterns(basketId, plan, context, result);
      
      // Seed connection intelligence
      result.connections_seeded = await this.seedConnections(basketId, plan, context, result);
      
      // Seed contextual intelligence
      result.context_seeded = await this.seedContext(basketId, plan, context, result);
      
      // Initialize Brain intelligence
      result.brain_initialized = await this.initializeBrain(basketId, plan, context, result);
      
      // Cache the result
      this.seedingHistory.set(basketId, result);
      
      return result;

    } catch (error) {
      console.error('Intelligence seeding failed:', error);
      result.errors.push(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  private async seedThemes(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    result: IntelligenceSeedingResult
  ): Promise<boolean> {
    
    try {
      const themesData = {
        basket_id: basketId,
        themes: plan.intelligenceSeeds.themes,
        business_context: {
          business_type: context.businessType,
          challenge: context.challenge,
          success_criteria: context.successCriteria,
          stakeholders: context.stakeholders
        },
        theme_metadata: this.generateThemeMetadata(plan.intelligenceSeeds.themes, context),
        seeding_config: {
          confidence_threshold: 0.7,
          auto_expand: true,
          learning_enabled: true,
          priority_weight: this.calculateThemePriority(context)
        }
      };

      const response = await fetchWithToken(`${this.baseUrl}/intelligence/seed-themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themesData)
      });

      if (response.ok) {
        result.total_seeds += plan.intelligenceSeeds.themes.length;
        return true;
      } else {
        result.errors.push(`Theme seeding failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      result.errors.push(`Theme seeding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async seedPatterns(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    result: IntelligenceSeedingResult
  ): Promise<boolean> {
    
    try {
      const patternsData = {
        basket_id: basketId,
        patterns: plan.intelligenceSeeds.patterns,
        business_patterns: this.extractBusinessPatterns(context),
        workflow_patterns: this.generateWorkflowPatterns(context),
        success_patterns: this.identifySuccessPatterns(context),
        pattern_metadata: {
          business_type: context.businessType,
          complexity_level: this.assessComplexity(context),
          stakeholder_patterns: this.analyzeStakeholderPatterns(context)
        },
        seeding_config: {
          pattern_learning: true,
          cross_reference: true,
          temporal_analysis: true,
          confidence_threshold: 0.6
        }
      };

      const response = await fetchWithToken(`${this.baseUrl}/intelligence/seed-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patternsData)
      });

      if (response.ok) {
        result.total_seeds += plan.intelligenceSeeds.patterns.length;
        return true;
      } else {
        result.errors.push(`Pattern seeding failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      result.errors.push(`Pattern seeding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async seedConnections(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    result: IntelligenceSeedingResult
  ): Promise<boolean> {
    
    try {
      const connectionsData = {
        basket_id: basketId,
        connections: plan.intelligenceSeeds.connections,
        relationship_map: this.buildRelationshipMap(context, plan),
        connection_strength: this.calculateConnectionStrengths(plan.intelligenceSeeds.connections, context),
        network_analysis: {
          stakeholder_network: this.analyzeStakeholderNetwork(context),
          concept_network: this.buildConceptNetwork(plan, context),
          dependency_network: this.identifyDependencies(context)
        },
        seeding_config: {
          network_expansion: true,
          strength_learning: true,
          bi_directional: true,
          decay_prevention: true
        }
      };

      const response = await fetchWithToken(`${this.baseUrl}/intelligence/seed-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionsData)
      });

      if (response.ok) {
        result.total_seeds += plan.intelligenceSeeds.connections.length;
        return true;
      } else {
        result.errors.push(`Connection seeding failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      result.errors.push(`Connection seeding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async seedContext(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    result: IntelligenceSeedingResult
  ): Promise<boolean> {
    
    try {
      const contextData = {
        basket_id: basketId,
        context_items: plan.contextItems,
        business_context: {
          type: context.businessType,
          challenge: context.challenge,
          success_criteria: context.successCriteria,
          stakeholders: context.stakeholders,
          existing_info: context.existingInfo
        },
        contextual_intelligence: {
          relevance_scoring: this.calculateRelevanceScores(plan.contextItems, context),
          temporal_context: this.buildTemporalContext(context),
          situational_context: this.analyzeSituationalContext(context),
          environmental_context: this.inferEnvironmentalContext(context)
        },
        seeding_config: {
          dynamic_relevance: true,
          context_expansion: true,
          multi_dimensional: true,
          adaptive_weighting: true
        }
      };

      const response = await fetchWithToken(`${this.baseUrl}/intelligence/seed-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextData)
      });

      if (response.ok) {
        result.total_seeds += plan.contextItems.length;
        return true;
      } else {
        result.errors.push(`Context seeding failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      result.errors.push(`Context seeding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async initializeBrain(
    basketId: string,
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    result: IntelligenceSeedingResult
  ): Promise<boolean> {
    
    try {
      const brainData = {
        basket_id: basketId,
        intelligence_profile: {
          themes: plan.intelligenceSeeds.themes,
          patterns: plan.intelligenceSeeds.patterns,
          connections: plan.intelligenceSeeds.connections,
          context_items: plan.contextItems
        },
        brain_configuration: {
          intelligence_level: 'comprehensive',
          learning_mode: 'active',
          suggestion_frequency: 'contextual',
          analysis_depth: 'detailed',
          response_personality: this.inferResponsePersonality(context)
        },
        initialization_data: {
          business_domain: context.businessType,
          primary_focus: context.challenge,
          success_metrics: context.successCriteria,
          stakeholder_map: context.stakeholders,
          workspace_purpose: plan.basketDescription
        },
        brain_capabilities: {
          contextual_analysis: true,
          pattern_recognition: true,
          predictive_suggestions: true,
          behavioral_adaptation: true,
          memory_integration: true,
          real_time_intelligence: true
        }
      };

      const response = await fetchWithToken(`${this.baseUrl}/intelligence/initialize-brain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brainData)
      });

      if (response.ok) {
        result.total_seeds += 1; // Brain initialization counts as one comprehensive seed
        return true;
      } else {
        result.errors.push(`Brain initialization failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      result.errors.push(`Brain initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // Helper methods for intelligence analysis and generation
  private generateThemeMetadata(themes: string[], context: BusinessContext) {
    return themes.map(theme => ({
      theme,
      relevance: this.calculateThemeRelevance(theme, context),
      context_anchors: this.findThemeAnchors(theme, context),
      expansion_potential: this.assessExpansionPotential(theme, context),
      priority_score: this.calculateThemePriority(context)
    }));
  }

  private calculateThemeRelevance(theme: string, context: BusinessContext): number {
    const contextText = `${context.businessType} ${context.challenge} ${context.successCriteria}`.toLowerCase();
    const themeWords = theme.toLowerCase().split('-');
    const matches = themeWords.filter(word => contextText.includes(word));
    return Math.min(0.95, 0.5 + (matches.length / themeWords.length) * 0.45);
  }

  private findThemeAnchors(theme: string, context: BusinessContext): string[] {
    const anchors: string[] = [];
    const contextFields = [context.businessType, context.challenge, context.successCriteria, context.stakeholders];
    
    contextFields.forEach(field => {
      if (field.toLowerCase().includes(theme.split('-')[0])) {
        anchors.push(field.substring(0, 50));
      }
    });
    
    return anchors.slice(0, 3);
  }

  private assessExpansionPotential(theme: string, context: BusinessContext): 'high' | 'medium' | 'low' {
    const complexityIndicators = ['strategic', 'complex', 'comprehensive', 'multiple', 'various'];
    const contextText = `${context.challenge} ${context.successCriteria}`.toLowerCase();
    const complexity = complexityIndicators.filter(indicator => contextText.includes(indicator)).length;
    
    if (complexity >= 2) return 'high';
    if (complexity >= 1) return 'medium';
    return 'low';
  }

  private calculateThemePriority(context: BusinessContext): number {
    // Higher priority for more specific business types and complex challenges
    const businessSpecificity = this.assessBusinessSpecificity(context.businessType);
    const challengeComplexity = this.assessChallengeComplexity(context.challenge);
    return (businessSpecificity + challengeComplexity) / 2;
  }

  private assessBusinessSpecificity(businessType: string): number {
    const specificTerms = ['startup', 'consulting', 'retail', 'technology', 'healthcare', 'manufacturing'];
    const hasSpecificTerm = specificTerms.some(term => businessType.toLowerCase().includes(term));
    return hasSpecificTerm ? 0.8 : 0.5;
  }

  private assessChallengeComplexity(challenge: string): number {
    const complexityKeywords = ['strategic', 'comprehensive', 'multiple', 'complex', 'integration', 'transformation'];
    const matches = complexityKeywords.filter((keyword: string) => challenge.toLowerCase().includes(keyword));
    return Math.min(0.9, 0.4 + (matches.length * 0.1));
  }

  private extractBusinessPatterns(context: BusinessContext): string[] {
    const patterns = [];
    const businessType = context.businessType.toLowerCase();
    
    if (businessType.includes('startup')) patterns.push('growth-focused', 'resource-constrained', 'pivot-ready');
    if (businessType.includes('consulting')) patterns.push('client-driven', 'expertise-based', 'project-oriented');
    if (businessType.includes('retail')) patterns.push('customer-centric', 'seasonal-aware', 'inventory-driven');
    if (businessType.includes('technology')) patterns.push('innovation-focused', 'agile-methodology', 'data-driven');
    
    return patterns;
  }

  private generateWorkflowPatterns(context: BusinessContext): string[] {
    const workflows = [];
    const challenge = context.challenge.toLowerCase();
    
    if (challenge.includes('develop') || challenge.includes('create')) workflows.push('development-cycle', 'iterative-creation');
    if (challenge.includes('improve') || challenge.includes('optimize')) workflows.push('optimization-cycle', 'continuous-improvement');
    if (challenge.includes('analyze') || challenge.includes('research')) workflows.push('analysis-workflow', 'research-methodology');
    if (challenge.includes('implement') || challenge.includes('execute')) workflows.push('implementation-pipeline', 'execution-framework');
    
    return workflows;
  }

  private identifySuccessPatterns(context: BusinessContext): string[] {
    const patterns = [];
    const success = context.successCriteria.toLowerCase();
    
    if (success.includes('increase') || success.includes('grow')) patterns.push('growth-measurement', 'expansion-tracking');
    if (success.includes('reduce') || success.includes('decrease')) patterns.push('reduction-metrics', 'efficiency-gains');
    if (success.includes('improve') || success.includes('enhance')) patterns.push('improvement-tracking', 'quality-metrics');
    if (success.includes('deliver') || success.includes('complete')) patterns.push('delivery-milestones', 'completion-criteria');
    
    return patterns;
  }

  private assessComplexity(context: BusinessContext): 'simple' | 'moderate' | 'complex' {
    const complexityScore = [
      context.challenge.split(' ').length > 10 ? 1 : 0,
      context.successCriteria.split(' ').length > 8 ? 1 : 0,
      context.stakeholders.includes(',') || context.stakeholders.includes('and') ? 1 : 0,
      context.existingInfo.length > 100 ? 1 : 0
    ].reduce((sum, val) => sum + val, 0);
    
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  private analyzeStakeholderPatterns(context: BusinessContext): string[] {
    const patterns = [];
    const stakeholders = context.stakeholders.toLowerCase();
    
    if (stakeholders.includes('team')) patterns.push('internal-collaboration');
    if (stakeholders.includes('client') || stakeholders.includes('customer')) patterns.push('external-engagement');
    if (stakeholders.includes('management') || stakeholders.includes('leadership')) patterns.push('hierarchical-approval');
    if (stakeholders.includes('partner')) patterns.push('partnership-coordination');
    
    return patterns;
  }

  private buildRelationshipMap(context: BusinessContext, plan: WorkspaceCreationPlan) {
    return {
      business_relationships: this.extractBusinessRelationships(context),
      document_relationships: this.buildDocumentRelationships(plan.documents),
      stakeholder_relationships: this.analyzeStakeholderRelationships(context),
      theme_relationships: this.buildThemeRelationships(plan.intelligenceSeeds.themes)
    };
  }

  private extractBusinessRelationships(context: BusinessContext): Array<{from: string, to: string, type: string}> {
    const relationships: Array<{from: string, to: string, type: string}> = [];
    
    relationships.push({
      from: 'business_type',
      to: 'challenge',
      type: 'contextual'  
    });
    
    relationships.push({
      from: 'challenge',
      to: 'success_criteria',
      type: 'causal'
    });
    
    relationships.push({
      from: 'stakeholders',
      to: 'success_criteria',
      type: 'evaluative'
    });
    
    return relationships;
  }

  private buildDocumentRelationships(documents: WorkspaceCreationPlan['documents']) {
    const relationships: Array<{from: string, to: string, type: string}> = [];
    
    for (let i = 0; i < documents.length - 1; i++) {
      relationships.push({
        from: documents[i].title,
        to: documents[i + 1].title,
        type: 'sequential'
      });
    }
    
    return relationships;
  }

  private analyzeStakeholderRelationships(context: BusinessContext) {
    // Simple stakeholder relationship analysis
    const stakeholders = context.stakeholders.split(/[,&]/).map(s => s.trim());
    const relationships: Array<{from: string, to: string, type: string}> = [];
    
    stakeholders.forEach((stakeholder, i) => {
      if (i < stakeholders.length - 1) {
        relationships.push({
          from: stakeholder,
          to: stakeholders[i + 1],
          type: 'collaborative'
        });
      }
    });
    
    return relationships;
  }

  private buildThemeRelationships(themes: string[]) {
    const relationships: Array<{from: string, to: string, type: string}> = [];
    
    themes.forEach((theme, i) => {
      themes.slice(i + 1).forEach(otherTheme => {
        if (this.themesAreRelated(theme, otherTheme)) {
          relationships.push({
            from: theme,
            to: otherTheme,
            type: 'thematic'
          });
        }
      });
    });
    
    return relationships;
  }

  private themesAreRelated(theme1: string, theme2: string): boolean {
    const words1 = theme1.split('-');
    const words2 = theme2.split('-');
    return words1.some(word => words2.includes(word));
  }

  private calculateConnectionStrengths(connections: string[], context: BusinessContext): Record<string, number> {
    const strengths: Record<string, number> = {};
    
    connections.forEach(connection => {
      // Calculate strength based on how well the connection relates to the business context
      const contextRelevance = this.calculateConnectionRelevance(connection, context);
      strengths[connection] = contextRelevance;
    });
    
    return strengths;
  }

  private calculateConnectionRelevance(connection: string, context: BusinessContext): number {
    const contextText = `${context.businessType} ${context.challenge} ${context.successCriteria} ${context.stakeholders}`.toLowerCase();
    const connectionParts = connection.toLowerCase().split('-');
    const matches = connectionParts.filter(part => contextText.includes(part));
    
    return Math.min(0.9, 0.3 + (matches.length / connectionParts.length) * 0.6);
  }

  private analyzeStakeholderNetwork(context: BusinessContext) {
    const stakeholders = context.stakeholders.split(/[,&]/).map(s => s.trim());
    return {
      nodes: stakeholders.map(stakeholder => ({
        id: stakeholder,
        type: this.inferStakeholderType(stakeholder),
        influence: this.assessStakeholderInfluence(stakeholder, context)
      })),
      edges: this.buildStakeholderEdges(stakeholders)
    };
  }

  private inferStakeholderType(stakeholder: string): string {
    const stakeholderLower = stakeholder.toLowerCase();
    if (stakeholderLower.includes('team') || stakeholderLower.includes('employee')) return 'internal';
    if (stakeholderLower.includes('client') || stakeholderLower.includes('customer')) return 'external';
    if (stakeholderLower.includes('management') || stakeholderLower.includes('leadership')) return 'leadership';
    if (stakeholderLower.includes('partner')) return 'partner';
    return 'general';
  }

  private assessStakeholderInfluence(stakeholder: string, context: BusinessContext): number {
    const stakeholderLower = stakeholder.toLowerCase();
    if (stakeholderLower.includes('leadership') || stakeholderLower.includes('ceo') || stakeholderLower.includes('director')) return 0.9;
    if (stakeholderLower.includes('management') || stakeholderLower.includes('manager')) return 0.8;
    if (stakeholderLower.includes('client') || stakeholderLower.includes('customer')) return 0.7;
    if (stakeholderLower.includes('team') || stakeholderLower.includes('staff')) return 0.6;
    return 0.5;
  }

  private buildStakeholderEdges(stakeholders: string[]) {
    const edges: Array<{from: string, to: string, relationship: string}> = [];
    stakeholders.forEach((stakeholder, i) => {
      stakeholders.slice(i + 1).forEach(otherStakeholder => {
        edges.push({
          from: stakeholder,
          to: otherStakeholder,
          relationship: 'collaborative'
        });
      });
    });
    return edges;
  }

  private buildConceptNetwork(plan: WorkspaceCreationPlan, context: BusinessContext) {
    const concepts = [...plan.intelligenceSeeds.themes, ...plan.intelligenceSeeds.patterns];
    return {
      nodes: concepts.map(concept => ({
        id: concept,
        type: 'concept',
        relevance: this.calculateConceptRelevance(concept, context)
      })),
      edges: this.buildConceptEdges(concepts)
    };
  }

  private calculateConceptRelevance(concept: string, context: BusinessContext): number {
    const contextText = `${context.challenge} ${context.successCriteria}`.toLowerCase();
    const conceptWords = concept.toLowerCase().split('-');
    const matches = conceptWords.filter(word => contextText.includes(word));
    return Math.min(0.9, 0.4 + (matches.length / conceptWords.length) * 0.5);
  }

  private buildConceptEdges(concepts: string[]) {
    const edges: Array<{from: string, to: string, relationship: string}> = [];
    concepts.forEach((concept, i) => {
      concepts.slice(i + 1).forEach(otherConcept => {
        if (this.conceptsAreRelated(concept, otherConcept)) {
          edges.push({
            from: concept,
            to: otherConcept,
            relationship: 'semantic'
          });
        }
      });
    });
    return edges;
  }

  private conceptsAreRelated(concept1: string, concept2: string): boolean {
    const words1 = concept1.split('-');
    const words2 = concept2.split('-');
    return words1.some(word => words2.includes(word)) || 
           this.haveSimilarMeaning(concept1, concept2);
  }

  private haveSimilarMeaning(concept1: string, concept2: string): boolean {
    // Simple semantic similarity check
    const similarityPairs = [
      ['growth', 'expansion'], ['analysis', 'assessment'], ['strategy', 'planning'],
      ['customer', 'client'], ['improvement', 'optimization'], ['development', 'creation']
    ];
    
    return similarityPairs.some(([word1, word2]) => 
      (concept1.includes(word1) && concept2.includes(word2)) ||
      (concept1.includes(word2) && concept2.includes(word1))
    );
  }

  private identifyDependencies(context: BusinessContext) {
    const dependencies = [];
    
    // Add dependency between challenge and success criteria
    dependencies.push({
      from: 'challenge_resolution',
      to: 'success_achievement', 
      type: 'causal',
      strength: 0.9
    });
    
    // Add dependency between stakeholders and success
    dependencies.push({
      from: 'stakeholder_alignment',
      to: 'success_achievement',
      type: 'enabler',
      strength: 0.8
    });
    
    return dependencies;
  }

  private calculateRelevanceScores(contextItems: any[], context: BusinessContext) {
    return contextItems.map(item => ({
      ...item,
      calculated_relevance: this.calculateItemRelevance(item, context),
      temporal_relevance: this.calculateTemporalRelevance(item),
      situational_relevance: this.calculateSituationalRelevance(item, context)
    }));
  }

  private calculateItemRelevance(item: any, context: BusinessContext): number {
    const itemContent = item.content?.toLowerCase() || '';
    const contextText = `${context.challenge} ${context.successCriteria}`.toLowerCase();
    
    const itemWords = itemContent.split(' ');
    const contextWords = contextText.split(' ');
    const commonWords = itemWords.filter((word: string) => contextWords.includes(word) && word.length > 3);
    
    return Math.min(0.95, 0.3 + (commonWords.length / Math.max(itemWords.length, contextWords.length)) * 0.65);
  }

  private calculateTemporalRelevance(item: any): number {
    // Higher relevance for recent items or items with temporal keywords
    const content = item.content?.toLowerCase() || '';
    const temporalKeywords = ['current', 'recent', 'now', 'today', 'immediate', 'urgent'];
    const hasTemporalKeywords = temporalKeywords.some(keyword => content.includes(keyword));
    
    return hasTemporalKeywords ? 0.8 : 0.6;
  }

  private calculateSituationalRelevance(item: any, context: BusinessContext): number {
    const itemContent = item.content?.toLowerCase() || '';
    const businessType = context.businessType.toLowerCase();
    
    return itemContent.includes(businessType) ? 0.9 : 0.7;
  }

  private buildTemporalContext(context: BusinessContext) {
    return {
      urgency_level: this.assessUrgency(context),
      timeline_horizon: this.inferTimelineHorizon(context),
      temporal_dependencies: this.identifyTemporalDependencies(context)
    };
  }

  private assessUrgency(context: BusinessContext): 'low' | 'medium' | 'high' {
    const urgencyKeywords = ['urgent', 'immediate', 'asap', 'quickly', 'deadline', 'time-sensitive'];
    const contextText = `${context.challenge} ${context.successCriteria}`.toLowerCase();
    const urgencyMatches = urgencyKeywords.filter(keyword => contextText.includes(keyword));
    
    if (urgencyMatches.length >= 2) return 'high';
    if (urgencyMatches.length >= 1) return 'medium';
    return 'low';
  }

  private inferTimelineHorizon(context: BusinessContext): 'short' | 'medium' | 'long' {
    const contextText = `${context.challenge} ${context.successCriteria}`.toLowerCase();
    
    if (contextText.includes('long-term') || contextText.includes('strategic')) return 'long';
    if (contextText.includes('medium-term') || contextText.includes('quarterly')) return 'medium';
    return 'short';
  }

  private identifyTemporalDependencies(context: BusinessContext): string[] {
    const dependencies = [];
    const contextText = `${context.challenge} ${context.existingInfo}`.toLowerCase();
    
    if (contextText.includes('before') || contextText.includes('prerequisite')) {
      dependencies.push('sequential_dependency');
    }
    if (contextText.includes('concurrent') || contextText.includes('parallel')) {
      dependencies.push('parallel_dependency');
    }
    if (contextText.includes('after') || contextText.includes('following')) {
      dependencies.push('consequent_dependency');
    }
    
    return dependencies;
  }

  private analyzeSituationalContext(context: BusinessContext) {
    return {
      business_situation: this.classifyBusinessSituation(context),
      challenge_category: this.categorizeChallenge(context),
      stakeholder_dynamics: this.analyzeStakeholderDynamics(context),
      resource_context: this.inferResourceContext(context)
    };
  }

  private classifyBusinessSituation(context: BusinessContext): string {
    const challenge = context.challenge.toLowerCase();
    
    if (challenge.includes('startup') || challenge.includes('new')) return 'startup_phase';
    if (challenge.includes('growth') || challenge.includes('scale')) return 'growth_phase';
    if (challenge.includes('transform') || challenge.includes('change')) return 'transformation_phase';
    if (challenge.includes('optimize') || challenge.includes('improve')) return 'optimization_phase';
    
    return 'operational_phase';
  }

  private categorizeChallenge(context: BusinessContext): string {
    const challenge = context.challenge.toLowerCase();
    
    if (challenge.includes('strategy') || challenge.includes('plan')) return 'strategic_challenge';
    if (challenge.includes('operations') || challenge.includes('process')) return 'operational_challenge';
    if (challenge.includes('people') || challenge.includes('team')) return 'organizational_challenge';
    if (challenge.includes('technology') || challenge.includes('system')) return 'technical_challenge';
    if (challenge.includes('market') || challenge.includes('customer')) return 'market_challenge';
    
    return 'general_challenge';
  }

  private analyzeStakeholderDynamics(context: BusinessContext): string {
    const stakeholders = context.stakeholders.toLowerCase();
    
    if (stakeholders.includes('leadership') && stakeholders.includes('team')) return 'hierarchical_dynamics';
    if (stakeholders.includes('client') && stakeholders.includes('internal')) return 'client_facing_dynamics';
    if (stakeholders.includes('partner') || stakeholders.includes('vendor')) return 'partnership_dynamics';
    if (stakeholders.includes('cross-functional') || stakeholders.includes('multiple')) return 'complex_dynamics';
    
    return 'simple_dynamics';
  }

  private inferResourceContext(context: BusinessContext): string {
    const contextText = `${context.challenge} ${context.existingInfo}`.toLowerCase();
    
    if (contextText.includes('limited') || contextText.includes('constraint')) return 'resource_constrained';
    if (contextText.includes('abundant') || contextText.includes('well-funded')) return 'resource_rich';
    if (contextText.includes('budget') || contextText.includes('cost')) return 'budget_conscious';
    
    return 'standard_resources';
  }

  private inferEnvironmentalContext(context: BusinessContext) {
    return {
      industry_context: this.inferIndustryContext(context),
      competitive_context: this.inferCompetitiveContext(context),
      regulatory_context: this.inferRegulatoryContext(context),
      technological_context: this.inferTechnologicalContext(context)
    };
  }

  private inferIndustryContext(context: BusinessContext): string {
    const businessType = context.businessType.toLowerCase();
    
    if (businessType.includes('technology') || businessType.includes('software')) return 'technology_industry';
    if (businessType.includes('healthcare') || businessType.includes('medical')) return 'healthcare_industry';
    if (businessType.includes('financial') || businessType.includes('banking')) return 'financial_industry';
    if (businessType.includes('retail') || businessType.includes('ecommerce')) return 'retail_industry';
    if (businessType.includes('consulting') || businessType.includes('services')) return 'services_industry';
    
    return 'general_industry';
  }

  private inferCompetitiveContext(context: BusinessContext): string {
    const contextText = `${context.challenge} ${context.existingInfo}`.toLowerCase();
    
    if (contextText.includes('competitive') || contextText.includes('competitor')) return 'highly_competitive';
    if (contextText.includes('market leader') || contextText.includes('dominant')) return 'market_leading';
    if (contextText.includes('niche') || contextText.includes('specialized')) return 'niche_market';
    
    return 'standard_competition';
  }

  private inferRegulatoryContext(context: BusinessContext): string {
    const businessType = context.businessType.toLowerCase();
    const contextText = `${context.challenge} ${context.existingInfo}`.toLowerCase();
    
    if (businessType.includes('healthcare') || contextText.includes('compliance')) return 'highly_regulated';
    if (businessType.includes('financial') || contextText.includes('regulation')) return 'regulated';
    if (contextText.includes('policy') || contextText.includes('legal')) return 'policy_sensitive';
    
    return 'standard_regulation';
  }

  private inferTechnologicalContext(context: BusinessContext): string {
    const contextText = `${context.challenge} ${context.businessType}`.toLowerCase();
    
    if (contextText.includes('ai') || contextText.includes('machine learning')) return 'ai_enabled';
    if (contextText.includes('digital') || contextText.includes('technology')) return 'digital_native';
    if (contextText.includes('automation') || contextText.includes('system')) return 'automation_focused';
    if (contextText.includes('data') || contextText.includes('analytics')) return 'data_driven';
    
    return 'standard_technology';
  }

  private inferResponsePersonality(context: BusinessContext): string {
    const businessType = context.businessType.toLowerCase();
    const challenge = context.challenge.toLowerCase();
    
    if (businessType.includes('startup') || challenge.includes('innovative')) return 'entrepreneurial';
    if (businessType.includes('consulting') || challenge.includes('strategic')) return 'analytical';
    if (businessType.includes('creative') || challenge.includes('design')) return 'creative';
    if (challenge.includes('technical') || challenge.includes('engineering')) return 'technical';
    
    return 'professional';
  }

  // Public methods for external access
  getSeedingHistory(): Map<string, IntelligenceSeedingResult> {
    return new Map(this.seedingHistory);
  }

  clearSeedingHistory(): void {
    this.seedingHistory.clear();
  }

  getSeedingResult(basketId: string): IntelligenceSeedingResult | undefined {
    return this.seedingHistory.get(basketId);
  }
}

// Global instance for use across the application
export const globalIntelligenceSeedingService = new IntelligenceSeedingService();