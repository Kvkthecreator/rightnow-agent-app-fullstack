// SYSTEMATIC REBUILD - Single service for ALL substrate operations
// Direct Supabase, no abstractions, simple async/await patterns

import { createSupabaseClient } from '@/lib/supabase/client';

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
      const response = await fetch('/api/substrate/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawDumpId,
          basketId: rawDump.basket_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Manager Agent failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Manager Agent processing failed');
      }

      console.log('✅ Manager Agent completed:', result.summary);
      
      return result.substrate;
      
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
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  async subscribeToBasket(basketId: string, callback: (data: any) => void) {
    try {
      // Ensure we have a valid session before subscribing
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }

      if (!session) {
        console.warn('No active session for realtime subscription');
        return null;
      }

      // Log the actual URL being used (for debugging)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'URL not set';
      console.log('Supabase URL:', supabaseUrl);
      
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
          console.error('CRITICAL: Using localhost URL in production!');
        }
      }

      // Create channel with proper configuration
      const channel = this.supabase.channel(`basket-${basketId}`, {
        config: {
          presence: {
            key: session.user.id,
          },
          broadcast: {
            self: true,
            ack: false
          }
        },
      });
      
      // Subscribe to substrate changes
      ['raw_dumps', 'blocks'].forEach(table => {
        channel.on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: `basket_id=eq.${basketId}`
          },
          (payload) => {
            console.log(`Change in ${table}:`, payload);
            callback(payload);
          }
        );
      });

      // Handle subscription status
      channel.subscribe((status, error) => {
        console.log(`Subscription status for basket ${basketId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime changes');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscription error:', error);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.subscribeToBasket(basketId, callback);
          }, 5000);
        }
      });
      
      return channel;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return null;
    }
  }
}

// Singleton instance
export const substrateService = new SubstrateService();