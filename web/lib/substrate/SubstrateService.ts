// SYSTEMATIC REBUILD - Single service for ALL substrate operations
// Direct Supabase, no abstractions, simple async/await patterns

import { createSupabaseClient } from '@/lib/supabase/client';
import { authHelper } from '@/lib/supabase/auth-helper';
import { apiClient } from '@/lib/api/client';

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
  private supabase = createSupabaseClient();

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
    try {
      const { data, error } = await this.supabase
        .from('blocks')
        .select('*')
        .eq('basket_id', basketId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Blocks table not accessible:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Blocks not available:', err);
      return [];
    }
  }

  // MANAGER AGENT: Single consolidated substrate processing
  async processRawDump(rawDumpId: string): Promise<{
    blocks: Block[];
    contextItems: ContextItem[];
    narrative: any[];
    relationships: any[];
  }> {
    try {
      // Get basket_id for the raw dump
      const { data: rawDump, error: fetchError } = await this.supabase
        .from('raw_dumps')
        .select('basket_id')
        .eq('id', rawDumpId)
        .single();

      if (fetchError || !rawDump) {
        throw new Error(`Failed to fetch raw dump: ${fetchError?.message}`);
      }

      console.log('🎯 Calling Manager Agent for complete substrate processing...');

      // CALL MANAGER AGENT - Single endpoint handles everything
      const result = await apiClient.request('/api/substrate/process', {
        method: 'POST',
        body: JSON.stringify({
          rawDumpId,
          basketId: rawDump.basket_id
        })
      });

      if (!result || (result as any)?.error) {
        throw new Error((result as any)?.error || 'Manager Agent failed');
      }
      
      if (!(result as any).success) {
        throw new Error((result as any).error || 'Manager Agent processing failed');
      }

      console.log('✅ Manager Agent completed:', (result as any).summary);
      
      return (result as any).substrate;
      
    } catch (error) {
      console.error('❌ Manager Agent processing failed:', error);
      throw new Error(`Failed to process raw dump: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Note: All substrate processing now handled by Manager Agent at /api/substrate/process
  // This eliminates mocks and provides real agent orchestration

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
    try {
      const { data, error } = await this.supabase
        .from('context_items')
        .select('*')
        .eq('basket_id', basketId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Context items table not accessible:', error.message);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (err) {
      console.warn('Context items not available:', err);
      return [];
    }
  }

  async addContextItem(
    basketId: string, 
    title: string, 
    description: string, 
    type: ContextItem['type']
  ): Promise<ContextItem> {
    try {
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
    } catch (err) {
      console.warn('Cannot add context item - table not accessible:', err);
      throw new Error('Context items feature not available');
    }
  }

  // ==========================================
  // DOCUMENTS - Final compositions
  // ==========================================

  async getDocuments(basketId: string): Promise<Document[]> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('basket_id', basketId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Documents table not accessible:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Documents not available:', err);
      return [];
    }
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
  // REAL-TIME SUBSCRIPTIONS (POLLING IMPLEMENTATION)
  // ==========================================

  /**
   * CURRENT IMPLEMENTATION: Polling-based subscription
   * 
   * Due to Supabase WebSocket authentication issues, this method now uses
   * polling instead of WebSocket subscriptions. Returns a polling interval
   * that can be cleared for cleanup.
   * 
   * WebSocket implementation preserved in comments below.
   */
  subscribeToBasket(basketId: string, callback: (data: any) => void) {
    console.log(`📊 Starting polling subscription for basket: ${basketId}`);

    // Track last seen timestamps for each table
    let lastBlockTimestamp = new Date().toISOString();
    let lastDumpTimestamp = new Date().toISOString();

    const pollForChanges = async () => {
      try {
        // Poll for blocks changes
        const { data: blocks, error: blocksError } = await this.supabase
          .from('blocks')
          .select('*')
          .eq('basket_id', basketId)
          .gt('created_at', lastBlockTimestamp)
          .order('created_at', { ascending: false });

        if (blocksError) {
          console.error('Polling error for blocks:', blocksError);
        } else if (blocks && blocks.length > 0) {
          blocks.forEach(block => {
            console.log('📊 Block changed via polling:', block.id);
            callback({
              eventType: 'UPDATE',
              new: block,
              old: null,
              schema: 'public',
              table: 'blocks'
            });
          });
          lastBlockTimestamp = blocks[0].created_at;
        }

        // Poll for raw_dumps changes
        const { data: rawDumps, error: rawDumpsError } = await this.supabase
          .from('raw_dumps')
          .select('*')
          .eq('basket_id', basketId)
          .gt('created_at', lastDumpTimestamp)
          .order('created_at', { ascending: false });

        if (rawDumpsError) {
          console.error('Polling error for raw_dumps:', rawDumpsError);
        } else if (rawDumps && rawDumps.length > 0) {
          rawDumps.forEach(dump => {
            console.log('📊 Raw dump changed via polling:', dump.id);
            callback({
              eventType: 'UPDATE',
              new: dump,
              old: null,
              schema: 'public',
              table: 'raw_dumps'
            });
          });
          lastDumpTimestamp = rawDumps[0].created_at;
        }

      } catch (error) {
        console.error('📊 Polling failed:', error);
      }
    };

    // Initial poll
    pollForChanges();

    // Set up polling interval (3 seconds)
    const interval = setInterval(pollForChanges, 3000);

    console.log(`📊 Polling interval started for basket: ${basketId}`);

    // Return interval for cleanup (same interface as WebSocket channel)
    return {
      unsubscribe: () => {
        clearInterval(interval);
        console.log(`📊 Polling stopped for basket: ${basketId}`);
      }
    };
  }

  /*
  // FUTURE: WebSocket implementation (commented out due to SDK auth issues)
  async subscribeToBasketWebSocket(basketId: string, callback: (data: any) => void) {
    try {
      // Ensure authenticated with secure helper
      const user = await authHelper.getAuthenticatedUser();
      if (!user) {
        console.error('No authenticated user for realtime subscription');
        return null;
      }

      // Verify basket access via workspace membership
      const hasAccess = await authHelper.checkBasketAccess(basketId);
      if (!hasAccess) {
        console.error('No basket access for basket subscription');
        return null;
      }

      // Get authenticated client for realtime connections
      const authenticatedClient = await authHelper.getAuthenticatedClient();
      if (!authenticatedClient) {
        console.error('Failed to get authenticated client for realtime');
        return null;
      }

      console.log(`📡 Setting up realtime for basket: ${basketId}`);

      // Single channel for all changes
      const channel = authenticatedClient
        .channel(`basket-changes-${basketId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `basket_id=eq.${basketId}`
          },
          (payload) => {
            console.log('Block changed:', payload);
            callback(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'raw_dumps',
            filter: `basket_id=eq.${basketId}`
          },
          (payload) => {
            console.log('Raw dump changed:', payload);
            callback(payload);
          }
        );

      // Subscribe
      const subscription = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscribed for basket:', basketId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check browser console for details');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Subscription timeout - will retry');
        } else {
          console.log('📡 Subscription status:', status);
        }
      });

      return channel;
    } catch (error) {
      console.error('Failed to setup realtime:', error);
      return null;
    }
  }
  
  // End of WebSocket implementation - uncomment when SDK auth issues are resolved
  */
}

// Singleton instance
export const substrateService = new SubstrateService();