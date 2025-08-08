// SYSTEMATIC REBUILD - Single service for ALL substrate operations
// Direct Supabase, no abstractions, simple async/await patterns

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface RawDump {
  id: string;
  basket_id: string;
  workspace_id: string;
  body_md: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  basket_id: string;
  raw_dump_id: string;
  title: string;
  body_md: string;
  status: 'proposed' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ContextItem {
  id: string;
  basket_id: string;
  title: string;
  description: string;
  type: 'theme' | 'question' | 'insight' | 'connection';
  created_at: string;
}

export interface Document {
  id: string;
  basket_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SubstrateData {
  rawDumps: RawDump[];
  blocks: Block[];
  contextItems: ContextItem[];
  documents: Document[];
}

export class SubstrateService {
  private supabase = createClientComponentClient();

  // ==========================================
  // RAW DUMPS - Primary input mechanism
  // ==========================================

  async getRawDumps(basketId: string): Promise<RawDump[]> {
    const { data, error } = await this.supabase
      .from('raw_dumps')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch raw dumps: ${error.message}`);
    return data || [];
  }

  async addRawDump(basketId: string, content: string, workspaceId = 'default'): Promise<RawDump> {
    const { data, error } = await this.supabase
      .from('raw_dumps')
      .insert({
        basket_id: basketId,
        workspace_id: workspaceId,
        body_md: content
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add raw dump: ${error.message}`);
    return data;
  }

  async updateRawDump(id: string, content: string): Promise<RawDump> {
    const { data, error } = await this.supabase
      .from('raw_dumps')
      .update({ body_md: content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update raw dump: ${error.message}`);
    return data;
  }

  async deleteRawDump(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('raw_dumps')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete raw dump: ${error.message}`);
  }

  // ==========================================
  // BLOCKS - AI-generated from raw dumps
  // ==========================================

  async getBlocks(basketId: string): Promise<Block[]> {
    const { data, error } = await this.supabase
      .from('blocks')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch blocks: ${error.message}`);
    return data || [];
  }

  async generateBlocksFromRawDump(rawDumpId: string): Promise<Block[]> {
    try {
      // Call Python agent for block generation
      const response = await fetch('https://api.yarnnn.com/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType: 'block_proposer',
          operation: 'generate_blocks',
          data: {
            raw_dump_id: rawDumpId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Agent call failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store generated blocks in database
      const blocks = result.data.blocks || [];
      const insertPromises = blocks.map((block: any) => 
        this.supabase
          .from('blocks')
          .insert({
            basket_id: block.basket_id,
            raw_dump_id: rawDumpId,
            title: block.title,
            body_md: block.content,
            status: 'proposed'
          })
      );

      await Promise.all(insertPromises);
      return await this.getBlocks(result.data.basket_id);
      
    } catch (error) {
      throw new Error(`Failed to generate blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async approveBlock(id: string): Promise<Block> {
    const { data, error } = await this.supabase
      .from('blocks')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve block: ${error.message}`);
    return data;
  }

  async rejectBlock(id: string): Promise<Block> {
    const { data, error } = await this.supabase
      .from('blocks')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to reject block: ${error.message}`);
    return data;
  }

  // ==========================================
  // CONTEXT ITEMS - Connections & themes
  // ==========================================

  async getContextItems(basketId: string): Promise<ContextItem[]> {
    const { data, error } = await this.supabase
      .from('context_items')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch context items: ${error.message}`);
    return data || [];
  }

  async addContextItem(
    basketId: string, 
    title: string, 
    description: string, 
    type: ContextItem['type']
  ): Promise<ContextItem> {
    const { data, error } = await this.supabase
      .from('context_items')
      .insert({
        basket_id: basketId,
        title,
        description,
        type
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add context item: ${error.message}`);
    return data;
  }

  // ==========================================
  // DOCUMENTS - Final compositions
  // ==========================================

  async getDocuments(basketId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return data || [];
  }

  async createDocument(basketId: string, title: string, content: string): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .insert({
        basket_id: basketId,
        title,
        content
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return data;
  }

  async updateDocument(id: string, title: string, content: string): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .update({ 
        title, 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return data;
  }

  // ==========================================
  // UNIFIED OPERATIONS - Load everything
  // ==========================================

  async getAllSubstrate(basketId: string): Promise<SubstrateData> {
    const [rawDumps, blocks, contextItems, documents] = await Promise.all([
      this.getRawDumps(basketId),
      this.getBlocks(basketId),
      this.getContextItems(basketId),
      this.getDocuments(basketId)
    ]);

    return {
      rawDumps,
      blocks,
      contextItems,
      documents
    };
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeToBasket(basketId: string, callback: (data: any) => void) {
    const channel = this.supabase.channel(`basket-${basketId}`);
    
    // Subscribe to all substrate changes
    ['raw_dumps', 'blocks', 'context_items', 'documents'].forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `basket_id=eq.${basketId}`
        },
        callback
      );
    });

    channel.subscribe();
    return channel;
  }
}

// Singleton instance
export const substrateService = new SubstrateService();