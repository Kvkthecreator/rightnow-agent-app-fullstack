// TRUE CONTEXT OS - The ONLY Substrate Handler
// Single source of truth for all substrate operations

import { 
  SubstrateElement, 
  SubstrateType, 
  SubstrateOperation, 
  SubstrateResponse, 
  RawDump, 
  Block, 
  ContextItem, 
  Narrative, 
  Document,
  Relationship,
  SubstrateRef,
  AgentRequest,
  AgentResponse,
  CompositionElement
} from './SubstrateTypes';

export class UnifiedSubstrateComposer {
  private static instance: UnifiedSubstrateComposer;
  
  // THE substrate state - no other source of truth
  private substrate = {
    rawDumps: new Map<string, RawDump>(),
    blocks: new Map<string, Block>(),
    contextItems: new Map<string, ContextItem>(),
    narrative: new Map<string, Narrative>(),
    documents: new Map<string, Document>(),
    relationships: new Map<string, Relationship[]>()
  };

  private constructor() {}

  public static getInstance(): UnifiedSubstrateComposer {
    if (!UnifiedSubstrateComposer.instance) {
      UnifiedSubstrateComposer.instance = new UnifiedSubstrateComposer();
    }
    return UnifiedSubstrateComposer.instance;
  }

  // CORE OPERATIONS - One method for each substrate operation

  async addRawDump(content: string, basketId: string, workspaceId: string): Promise<SubstrateResponse> {
    try {
      const rawDump: RawDump = {
        id: this.generateId(),
        type: 'raw_dump',
        content,
        basketId,
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store locally
      this.substrate.rawDumps.set(rawDump.id, rawDump);

      // Send to backend for processing
      await this.persistSubstrate(rawDump);

      return {
        success: true,
        data: rawDump
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add raw dump'
      };
    }
  }

  async proposeBlocks(rawDumpId: string): Promise<SubstrateResponse> {
    try {
      const rawDump = this.substrate.rawDumps.get(rawDumpId);
      if (!rawDump) {
        return { success: false, error: 'Raw dump not found' };
      }

      // Call block proposal agent
      const agentResponse = await this.callAgent('block_proposer', {
        rawDumpId,
        content: rawDump.content,
        basketId: rawDump.basketId,
        workspaceId: rawDump.workspaceId
      });

      if (!agentResponse.success) {
        return agentResponse;
      }

      // Convert agent response to blocks
      const blocks: Block[] = agentResponse.data.map((blockData: any) => ({
        id: this.generateId(),
        type: 'block' as const,
        title: blockData.title,
        content: blockData.content,
        status: 'proposed' as const,
        rawDumpId,
        basketId: rawDump.basketId,
        workspaceId: rawDump.workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: blockData.metadata
      }));

      // Store blocks
      blocks.forEach(block => {
        this.substrate.blocks.set(block.id, block);
      });

      // Create relationships
      const relationships = blocks.map(block => ({
        id: this.generateId(),
        from: { id: block.id, type: 'block' as const, basketId: block.basketId },
        to: { id: rawDumpId, type: 'raw_dump' as const, basketId: rawDump.basketId },
        type: 'derives_from' as const
      }));

      relationships.forEach(rel => {
        const existing = this.substrate.relationships.get(rel.from.id) || [];
        this.substrate.relationships.set(rel.from.id, [...existing, rel]);
      });

      return {
        success: true,
        data: blocks,
        relationships
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to propose blocks'
      };
    }
  }

  async createContextItem(
    title: string, 
    semanticType: ContextItem['semanticType'], 
    references: SubstrateRef[],
    basketId: string,
    workspaceId: string,
    description?: string
  ): Promise<SubstrateResponse> {
    try {
      const contextItem: ContextItem = {
        id: this.generateId(),
        type: 'context_item',
        title,
        description,
        semanticType,
        references,
        basketId,
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.substrate.contextItems.set(contextItem.id, contextItem);

      // Create relationships to referenced substrate
      const relationships: Relationship[] = references.map(ref => ({
        id: this.generateId(),
        from: { id: contextItem.id, type: 'context_item', basketId },
        to: ref,
        type: 'contextualizes'
      }));

      relationships.forEach(rel => {
        const existing = this.substrate.relationships.get(rel.from.id) || [];
        this.substrate.relationships.set(rel.from.id, [...existing, rel]);
      });

      await this.persistSubstrate(contextItem);

      return {
        success: true,
        data: contextItem,
        relationships
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create context item'
      };
    }
  }

  async composeDocument(
    title: string,
    composition: { type: SubstrateType; id: string; order: number; excerpt?: string }[],
    basketId: string,
    workspaceId: string
  ): Promise<SubstrateResponse> {
    try {
      const compositionElements: CompositionElement[] = composition.map(elem => ({
        id: this.generateId(),
        type: elem.type,
        substrateId: elem.id,
        order: elem.order,
        excerpt: elem.excerpt,
        displayMode: elem.excerpt ? 'excerpt' : 'full'
      }));

      const document: Document = {
        id: this.generateId(),
        type: 'document',
        title,
        composition: compositionElements,
        basketId,
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.substrate.documents.set(document.id, document);

      // Create relationships to composed substrate
      const relationships: Relationship[] = compositionElements.map(elem => ({
        id: this.generateId(),
        from: { id: document.id, type: 'document', basketId },
        to: { id: elem.substrateId, type: elem.type, basketId },
        type: 'references'
      }));

      relationships.forEach(rel => {
        const existing = this.substrate.relationships.get(rel.from.id) || [];
        this.substrate.relationships.set(rel.from.id, [...existing, rel]);
      });

      await this.persistSubstrate(document);

      return {
        success: true,
        data: document,
        relationships
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compose document'
      };
    }
  }

  async linkSubstrate(
    from: SubstrateRef, 
    to: SubstrateRef, 
    type: Relationship['type']
  ): Promise<SubstrateResponse> {
    try {
      const relationship: Relationship = {
        id: this.generateId(),
        from,
        to,
        type
      };

      const existing = this.substrate.relationships.get(from.id) || [];
      this.substrate.relationships.set(from.id, [...existing, relationship]);

      return {
        success: true,
        data: relationship
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link substrate'
      };
    }
  }

  // AGENT OPERATIONS - Unified interface to Python backend

  async processWithAgent(agentType: string, operation: string, data: any): Promise<SubstrateResponse> {
    try {
      const response = await this.callAgent(agentType, { operation, ...data });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to process with agent ${agentType}`
      };
    }
  }

  // QUERY OPERATIONS

  getSubstrateByType(type: SubstrateType, basketId: string): SubstrateElement[] {
    const typeMap = this.substrate[`${type}s` as keyof typeof this.substrate] as Map<string, any>;
    return Array.from(typeMap.values()).filter(element => element.basketId === basketId);
  }

  getRelationships(substrateId: string): Relationship[] {
    return this.substrate.relationships.get(substrateId) || [];
  }

  findConnections(elementId: string): SubstrateElement[] {
    const relationships = this.getRelationships(elementId);
    const connections: SubstrateElement[] = [];

    relationships.forEach(rel => {
      const connectedId = rel.from.id === elementId ? rel.to.id : rel.from.id;
      const connectedType = rel.from.id === elementId ? rel.to.type : rel.from.type;
      
      const typeMap = this.substrate[`${connectedType}s` as keyof typeof this.substrate] as Map<string, any>;
      const element = typeMap.get(connectedId);
      if (element) {
        connections.push(element);
      }
    });

    return connections;
  }

  // PRIVATE METHODS

  private async callAgent(agentType: string, data: any): Promise<AgentResponse> {
    const request: AgentRequest = {
      agentType,
      operation: 'process',
      data,
      basketId: data.basketId,
      workspaceId: data.workspaceId
    };

    const response = await fetch('https://api.yarnnn.com/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers as needed
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Agent call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async persistSubstrate(substrate: SubstrateElement): Promise<void> {
    // Persist to database via our API
    const response = await fetch('/api/substrate/persist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(substrate)
    });

    if (!response.ok) {
      throw new Error(`Failed to persist substrate: ${response.statusText}`);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}