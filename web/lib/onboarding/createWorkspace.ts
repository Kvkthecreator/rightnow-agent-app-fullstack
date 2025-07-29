import { WorkspaceCreationPlan, BusinessContext } from "@/components/onboarding/OnboardingAgent";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { globalSubstrateService } from "./substrateIntegration";

export interface CreatedDocument {
  id: string;
  title: string;
  type: string;
  initialContent: string;
  blocks: CreatedBlock[];
}

export interface CreatedBlock {
  id: string;
  type: string;
  content: string;
  position: number;
}

export interface WorkspaceCreationResult {
  basketId: string;
  documents: CreatedDocument[];
  initialIntelligence: {
    themes: string[];
    contextItems: number;
    intelligenceActive: boolean;
  };
}

export async function createWorkspace(
  plan: WorkspaceCreationPlan,
  context: BusinessContext
): Promise<WorkspaceCreationResult> {
  
  try {
    // First try using the substrate integration service
    const workspaceId = await getOrCreateWorkspaceId();
    
    try {
      const substrateResult = await globalSubstrateService.createWorkspaceWithSubstrate(
        plan,
        context,
        workspaceId
      );
      
      // Convert substrate result to our expected format
      return {
        basketId: substrateResult.basket.id,
        documents: substrateResult.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.document_type,
          initialContent: doc.content,
          blocks: substrateResult.blocks
            .filter(block => block.document_id === doc.id)
            .map(block => ({
              id: block.id,
              type: block.semantic_type,
              content: block.canonical_value,
              position: 0 // Will be set by substrate
            }))
        })),
        initialIntelligence: {
          themes: plan.intelligenceSeeds.themes,
          contextItems: plan.contextItems.length,
          intelligenceActive: substrateResult.intelligence_initialized
        }
      };
      
    } catch (substrateError) {
      console.warn('Substrate creation failed, falling back to direct API calls:', substrateError);
    }

    // Fallback to direct API approach
    return createWorkspaceWithDirectAPIs(plan, context);
    
  } catch (error) {
    console.error('Workspace creation failed:', error);
    throw new Error('Failed to create workspace. Please try again.');
  }
}

// Renamed original function for fallback
async function createWorkspaceWithDirectAPIs(
  plan: WorkspaceCreationPlan,
  context: BusinessContext
): Promise<WorkspaceCreationResult> {
  
  // Step 1: Create the basket
  const basket = await createBasket(plan, context);
  
  // Step 2: Create documents with initial content
  const documents = await createDocuments(basket.id, plan.documents);
  
  // Step 3: Create blocks for each document
  const documentsWithBlocks = await createBlocksForDocuments(documents, plan);
  
  // Step 4: Seed intelligence analysis
  await seedIntelligenceAnalysis(basket.id, plan, context);
  
  // Step 5: Initialize Brain sidebar intelligence
  await initializeBrainIntelligence(basket.id, plan.intelligenceSeeds);
  
  return {
    basketId: basket.id,
    documents: documentsWithBlocks,
    initialIntelligence: {
      themes: plan.intelligenceSeeds.themes,
      contextItems: plan.contextItems.length,
      intelligenceActive: true
    }
  };
}

// Helper function to get or create workspace ID
async function getOrCreateWorkspaceId(): Promise<string> {
  // This should integrate with your workspace management system
  // For now, we'll use a placeholder approach
  try {
    const response = await fetchWithToken('/api/workspace/current');
    if (response.ok) {
      const workspace = await response.json();
      return workspace.id;
    }
  } catch (error) {
    console.warn('Could not fetch current workspace, using default');
  }
  
  // Fallback to a default workspace ID or create one
  return 'default-workspace-id';
}

async function createBasket(plan: WorkspaceCreationPlan, context: BusinessContext) {
  const response = await fetchWithToken('/api/baskets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: plan.basketName,
      description: plan.basketDescription,
      metadata: {
        createdVia: 'onboarding',
        businessContext: context,
        intelligenceSeeds: plan.intelligenceSeeds
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create basket');
  }

  return response.json();
}

async function createDocuments(basketId: string, documentPlans: WorkspaceCreationPlan['documents']) {
  const documents: CreatedDocument[] = [];
  
  for (const docPlan of documentPlans) {
    const response = await fetchWithToken('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        basket_id: basketId,
        title: docPlan.title,
        content: docPlan.initialContent,
        document_type: docPlan.type,
        metadata: {
          createdVia: 'onboarding',
          suggestedBlocks: docPlan.suggestedBlocks
        }
      })
    });

    if (!response.ok) {
      console.error(`Failed to create document: ${docPlan.title}`);
      continue; // Continue with other documents
    }

    const document = await response.json();
    documents.push({
      id: document.id,
      title: document.title,
      type: docPlan.type,
      initialContent: docPlan.initialContent,
      blocks: [] // Will be populated in next step
    });
  }
  
  return documents;
}

async function createBlocksForDocuments(
  documents: CreatedDocument[],
  plan: WorkspaceCreationPlan
): Promise<CreatedDocument[]> {
  
  const documentsWithBlocks = await Promise.all(
    documents.map(async (doc) => {
      const docPlan = plan.documents.find(p => p.title === doc.title);
      if (!docPlan) return doc;
      
      const blocks = await createBlocksForDocument(doc.id, docPlan.suggestedBlocks, doc.initialContent);
      
      return {
        ...doc,
        blocks
      };
    })
  );
  
  return documentsWithBlocks;
}

async function createBlocksForDocument(
  documentId: string,
  suggestedBlocks: string[],
  content: string
): Promise<CreatedBlock[]> {
  
  const blocks: CreatedBlock[] = [];
  
  // Create blocks based on content structure and suggestions
  const contentSections = content.split('\n## ').filter(section => section.trim());
  
  for (let i = 0; i < Math.min(contentSections.length, suggestedBlocks.length); i++) {
    const section = contentSections[i];
    const blockTitle = suggestedBlocks[i];
    
    try {
      const response = await fetchWithToken('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          semantic_type: inferBlockType(blockTitle),
          canonical_value: blockTitle,
          context: section.split('\n')[0], // Use first line as context
          state: 'PROPOSED',
          metadata: {
            createdVia: 'onboarding',
            suggestedContent: section.substring(0, 200)
          }
        })
      });

      if (response.ok) {
        const block = await response.json();
        blocks.push({
          id: block.id,
          type: block.semantic_type,
          content: blockTitle,
          position: i
        });
      }
    } catch (error) {
      console.error(`Failed to create block: ${blockTitle}`, error);
      // Continue with other blocks
    }
  }
  
  return blocks;
}

function inferBlockType(blockTitle: string): string {
  const title = blockTitle.toLowerCase();
  
  if (title.includes('summary') || title.includes('overview')) return 'SUMMARY';
  if (title.includes('analysis') || title.includes('assessment')) return 'ANALYSIS';
  if (title.includes('plan') || title.includes('roadmap') || title.includes('timeline')) return 'PLAN';
  if (title.includes('research') || title.includes('data') || title.includes('findings')) return 'DATA';
  if (title.includes('recommendation') || title.includes('suggestion')) return 'RECOMMENDATION';
  if (title.includes('objective') || title.includes('goal') || title.includes('criteria')) return 'OBJECTIVE';
  if (title.includes('risk') || title.includes('challenge') || title.includes('issue')) return 'RISK';
  if (title.includes('next steps') || title.includes('action') || title.includes('implementation')) return 'ACTION';
  
  return 'INSIGHT'; // Default type
}

async function seedIntelligenceAnalysis(
  basketId: string,
  plan: WorkspaceCreationPlan,
  context: BusinessContext
) {
  
  try {
    // Seed thematic analysis
    await fetchWithToken('/api/intelligence/seed-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        basket_id: basketId,
        themes: plan.intelligenceSeeds.themes,
        patterns: plan.intelligenceSeeds.patterns,
        context_items: plan.contextItems,
        business_context: context
      })
    });
    
  } catch (error) {
    console.error('Failed to seed intelligence analysis:', error);
    // Non-critical - workspace can function without initial intelligence
  }
}

async function initializeBrainIntelligence(
  basketId: string,
  intelligenceSeeds: WorkspaceCreationPlan['intelligenceSeeds']
) {
  
  try {
    // Initialize Brain sidebar with immediate intelligence
    await fetchWithToken('/api/intelligence/initialize-brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        basket_id: basketId,
        initial_themes: intelligenceSeeds.themes,
        initial_patterns: intelligenceSeeds.patterns,
        initial_connections: intelligenceSeeds.connections
      })
    });
    
  } catch (error) {
    console.error('Failed to initialize brain intelligence:', error);
    // Non-critical - intelligence will build over time
  }
}

// Helper function to generate mock data if APIs are not ready
export async function createWorkspaceMock(
  plan: WorkspaceCreationPlan,
  context: BusinessContext
): Promise<WorkspaceCreationResult> {
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock IDs
  const basketId = `basket_${Date.now()}`;
  
  const documents: CreatedDocument[] = plan.documents.map((doc, index) => ({
    id: `doc_${Date.now()}_${index}`,
    title: doc.title,
    type: doc.type,
    initialContent: doc.initialContent,
    blocks: doc.suggestedBlocks.map((block, blockIndex) => ({
      id: `block_${Date.now()}_${index}_${blockIndex}`,
      type: inferBlockType(block),
      content: block,
      position: blockIndex
    }))
  }));
  
  return {
    basketId,
    documents,
    initialIntelligence: {
      themes: plan.intelligenceSeeds.themes,
      contextItems: plan.contextItems.length,
      intelligenceActive: true
    }
  };
}