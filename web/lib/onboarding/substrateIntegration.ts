import { fetchWithToken } from "@/lib/fetchWithToken";
import { WorkspaceCreationPlan, BusinessContext } from "@/components/onboarding/OnboardingAgent";

// Substrate API integration for onboarding workspace creation
export interface SubstrateBasket {
  id: string;
  name: string;
  description?: string;
  status: string;
  workspace_id: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SubstrateDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  basket_id: string;
  workspace_id: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SubstrateBlock {
  id: string;
  semantic_type: string;
  canonical_value: string;
  context?: string;
  document_id: string;
  basket_id: string;
  state: 'PROPOSED' | 'VALIDATED' | 'IMPLEMENTED';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SubstrateCreationResult {
  basket: SubstrateBasket;
  documents: SubstrateDocument[];
  blocks: SubstrateBlock[];
  intelligence_initialized: boolean;
}

export class SubstrateIntegrationService {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async createWorkspaceWithSubstrate(
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    workspaceId: string
  ): Promise<SubstrateCreationResult> {
    
    try {
      // Step 1: Create basket using substrate APIs
      const basket = await this.createBasket(plan, context, workspaceId);
      
      // Step 2: Create documents with substrate APIs
      const documents = await this.createDocuments(basket.id, plan.documents, workspaceId);
      
      // Step 3: Create blocks for documents using substrate APIs
      const blocks = await this.createBlocks(documents, plan, basket.id);
      
      // Step 4: Initialize intelligence systems
      const intelligenceInitialized = await this.initializeIntelligence(
        basket.id, 
        plan.intelligenceSeeds, 
        context
      );

      return {
        basket,
        documents,
        blocks,
        intelligence_initialized: intelligenceInitialized
      };

    } catch (error) {
      console.error('Substrate workspace creation failed:', error);
      throw new Error(`Failed to create workspace via substrate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createBasket(
    plan: WorkspaceCreationPlan,
    context: BusinessContext,
    workspaceId: string
  ): Promise<SubstrateBasket> {
    
    const basketData = {
      name: plan.basketName,
      description: plan.basketDescription,
      workspace_id: workspaceId,
      status: 'active',
      metadata: {
        created_via: 'onboarding',
        business_context: {
          business_type: context.businessType,
          challenge: context.challenge,
          success_criteria: context.successCriteria,
          stakeholders: context.stakeholders
        },
        intelligence_seeds: plan.intelligenceSeeds,
        context_items_count: plan.contextItems.length,
        documents_planned: plan.documents.length
      }
    };

    const response = await fetchWithToken(`${this.baseUrl}/baskets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basketData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Basket creation failed: ${response.status} ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  private async createDocuments(
    basketId: string,
    documentPlans: WorkspaceCreationPlan['documents'],
    workspaceId: string
  ): Promise<SubstrateDocument[]> {
    
    const documents: SubstrateDocument[] = [];
    
    for (const docPlan of documentPlans) {
      try {
        const documentData = {
          title: docPlan.title,
          content: docPlan.initialContent,
          document_type: docPlan.type,
          basket_id: basketId,
          workspace_id: workspaceId,
          metadata: {
            created_via: 'onboarding',
            suggested_blocks: docPlan.suggestedBlocks,
            document_plan: {
              type: docPlan.type,
              purpose: this.inferDocumentPurpose(docPlan.type),
              suggested_structure: docPlan.suggestedBlocks
            }
          }
        };

        const response = await fetchWithToken(`${this.baseUrl}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData)
        });

        if (response.ok) {
          const document = await response.json();
          documents.push(document);
        } else {
          console.error(`Failed to create document: ${docPlan.title}`, response.status);
          // Continue with other documents rather than failing entirely
        }

      } catch (error) {
        console.error(`Error creating document ${docPlan.title}:`, error);
        // Continue with other documents
      }
    }
    
    return documents;
  }

  private async createBlocks(
    documents: SubstrateDocument[],
    plan: WorkspaceCreationPlan,
    basketId: string
  ): Promise<SubstrateBlock[]> {
    
    const blocks: SubstrateBlock[] = [];
    
    for (const document of documents) {
      try {
        const docPlan = plan.documents.find(p => p.title === document.title);
        if (!docPlan) continue;
        
        const documentBlocks = await this.createBlocksForDocument(
          document,
          docPlan.suggestedBlocks,
          basketId
        );
        
        blocks.push(...documentBlocks);
        
      } catch (error) {
        console.error(`Error creating blocks for document ${document.title}:`, error);
        // Continue with other documents
      }
    }
    
    return blocks;
  }

  private async createBlocksForDocument(
    document: SubstrateDocument,
    suggestedBlocks: string[],
    basketId: string
  ): Promise<SubstrateBlock[]> {
    
    const blocks: SubstrateBlock[] = [];
    
    // Extract content sections for block creation
    const contentSections = this.extractContentSections(document.content);
    
    for (let i = 0; i < Math.min(suggestedBlocks.length, 5); i++) {
      const blockTitle = suggestedBlocks[i];
      const blockContext = contentSections[i] || document.content.substring(0, 200);
      
      try {
        const blockData = {
          semantic_type: this.inferBlockSemanticType(blockTitle),
          canonical_value: blockTitle,
          context: blockContext,
          document_id: document.id,
          basket_id: basketId,
          state: 'PROPOSED' as const,
          metadata: {
            created_via: 'onboarding',
            suggested_title: blockTitle,
            document_section: i,
            auto_generated: true,
            relevance_score: this.calculateBlockRelevance(blockTitle, document.title)
          }
        };

        const response = await fetchWithToken(`${this.baseUrl}/blocks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blockData)
        });

        if (response.ok) {
          const block = await response.json();
          blocks.push(block);
        }

      } catch (error) {
        console.error(`Error creating block ${blockTitle}:`, error);
        // Continue with other blocks
      }
    }
    
    return blocks;
  }

  private async initializeIntelligence(
    basketId: string,
    intelligenceSeeds: WorkspaceCreationPlan['intelligenceSeeds'],
    context: BusinessContext
  ): Promise<boolean> {
    
    try {
      // Initialize thematic analysis
      await this.seedThematicAnalysis(basketId, intelligenceSeeds, context);
      
      // Initialize pattern recognition
      await this.seedPatternRecognition(basketId, intelligenceSeeds, context);
      
      // Initialize Brain sidebar intelligence
      await this.initializeBrainIntelligence(basketId, intelligenceSeeds);
      
      return true;
      
    } catch (error) {
      console.error('Intelligence initialization failed:', error);
      // Non-critical failure - workspace can function without initial intelligence
      return false;
    }
  }

  private async seedThematicAnalysis(
    basketId: string,
    seeds: WorkspaceCreationPlan['intelligenceSeeds'],
    context: BusinessContext
  ): Promise<void> {
    
    const analysisData = {
      basket_id: basketId,
      themes: seeds.themes,
      context_data: {
        business_type: context.businessType,
        challenge: context.challenge,
        success_criteria: context.successCriteria,
        stakeholders: context.stakeholders
      },
      analysis_type: 'onboarding_seed',
      metadata: {
        created_via: 'onboarding',
        seed_confidence: 0.8,
        requires_validation: true
      }
    };

    // Call intelligence seeding API if available
    try {
      await fetchWithToken(`${this.baseUrl}/intelligence/seed-themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });
    } catch (error) {
      console.warn('Thematic analysis seeding failed:', error);
      // Non-critical - continue with other intelligence initialization
    }
  }

  private async seedPatternRecognition(
    basketId: string,
    seeds: WorkspaceCreationPlan['intelligenceSeeds'],
    context: BusinessContext
  ): Promise<void> {
    
    const patternData = {
      basket_id: basketId,
      patterns: seeds.patterns,
      connections: seeds.connections,
      context_data: {
        business_relationships: this.extractBusinessRelationships(context),
        workflow_patterns: this.inferWorkflowPatterns(context),
        success_patterns: this.extractSuccessPatterns(context)
      },
      metadata: {
        created_via: 'onboarding',
        pattern_confidence: 0.7,
        learning_enabled: true
      }
    };

    try {
      await fetchWithToken(`${this.baseUrl}/intelligence/seed-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patternData)
      });
    } catch (error) {
      console.warn('Pattern recognition seeding failed:', error);
      // Non-critical - continue with other intelligence initialization
    }
  }

  private async initializeBrainIntelligence(
    basketId: string,
    seeds: WorkspaceCreationPlan['intelligenceSeeds']
  ): Promise<void> {
    
    const brainData = {
      basket_id: basketId,
      initial_themes: seeds.themes,
      initial_patterns: seeds.patterns,
      initial_connections: seeds.connections,
      intelligence_level: 'comprehensive',
      metadata: {
        created_via: 'onboarding',
        immediate_activation: true,
        brain_version: '1.0'
      }
    };

    try {
      await fetchWithToken(`${this.baseUrl}/intelligence/initialize-brain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brainData)
      });
    } catch (error) {
      console.warn('Brain intelligence initialization failed:', error);
      // Non-critical - Brain will build intelligence over time
    }
  }

  // Helper methods
  private inferDocumentPurpose(documentType: string): string {
    const purposes = {
      strategy: 'Define strategic direction and high-level approach',
      analysis: 'Analyze current situation and identify key insights',
      research: 'Gather and organize relevant information and findings',
      planning: 'Develop actionable implementation plans and timelines'
    };
    return purposes[documentType as keyof typeof purposes] || 'General business document';
  }

  private extractContentSections(content: string): string[] {
    // Split content by markdown headers and extract first line of each section
    const sections = content.split('\n## ').filter(section => section.trim());
    return sections.map(section => {
      const lines = section.split('\n');
      return lines.slice(0, 2).join(' ').substring(0, 150);
    });
  }

  private inferBlockSemanticType(blockTitle: string): string {
    const title = blockTitle.toLowerCase();
    
    if (title.includes('summary') || title.includes('overview')) return 'SUMMARY';
    if (title.includes('analysis') || title.includes('assessment')) return 'ANALYSIS';
    if (title.includes('plan') || title.includes('roadmap') || title.includes('timeline')) return 'PLAN';
    if (title.includes('research') || title.includes('data') || title.includes('findings')) return 'DATA';
    if (title.includes('recommendation') || title.includes('suggestion')) return 'RECOMMENDATION';
    if (title.includes('objective') || title.includes('goal') || title.includes('criteria')) return 'OBJECTIVE';
    if (title.includes('risk') || title.includes('challenge') || title.includes('issue')) return 'RISK';
    if (title.includes('next steps') || title.includes('action') || title.includes('implementation')) return 'ACTION';
    
    return 'INSIGHT';
  }

  private calculateBlockRelevance(blockTitle: string, documentTitle: string): number {
    const blockWords = blockTitle.toLowerCase().split(' ');
    const docWords = documentTitle.toLowerCase().split(' ');
    const commonWords = blockWords.filter(word => docWords.includes(word));
    
    return Math.min(0.9, 0.5 + (commonWords.length / Math.max(blockWords.length, docWords.length)) * 0.4);
  }

  private extractBusinessRelationships(context: BusinessContext): string[] {
    const relationships = [];
    const stakeholders = context.stakeholders.toLowerCase();
    
    if (stakeholders.includes('team')) relationships.push('internal-team');
    if (stakeholders.includes('client') || stakeholders.includes('customer')) relationships.push('external-client');
    if (stakeholders.includes('management') || stakeholders.includes('leadership')) relationships.push('management-level');
    if (stakeholders.includes('partner')) relationships.push('partnership');
    
    return relationships;
  }

  private inferWorkflowPatterns(context: BusinessContext): string[] {
    const patterns = [];
    const challenge = context.challenge.toLowerCase();
    
    if (challenge.includes('develop') || challenge.includes('create')) patterns.push('development-workflow');
    if (challenge.includes('improve') || challenge.includes('optimize')) patterns.push('optimization-workflow');
    if (challenge.includes('analyze') || challenge.includes('research')) patterns.push('analysis-workflow');
    if (challenge.includes('implement') || challenge.includes('execute')) patterns.push('implementation-workflow');
    
    return patterns;
  }

  private extractSuccessPatterns(context: BusinessContext): string[] {
    const patterns = [];
    const success = context.successCriteria.toLowerCase();
    
    if (success.includes('increase') || success.includes('grow')) patterns.push('growth-success');
    if (success.includes('reduce') || success.includes('decrease')) patterns.push('reduction-success');
    if (success.includes('improve') || success.includes('enhance')) patterns.push('improvement-success');
    if (success.includes('deliver') || success.includes('complete')) patterns.push('delivery-success');
    
    return patterns;
  }
}

// Global instance for use across the application
export const globalSubstrateService = new SubstrateIntegrationService();