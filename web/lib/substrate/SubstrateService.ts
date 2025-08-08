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
      // Check authentication first
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return null;
      }

      console.log('Subscribing to basket:', basketId, 'User:', user.id);

      // Create a unique channel name to avoid conflicts
      const channelName = `basket-${basketId}-${Date.now()}`;
      
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'raw_dumps',
            filter: `basket_id=eq.${basketId}`
          },
          (payload) => {
            console.log('Raw dumps change:', payload);
            callback(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `basket_id=eq.${basketId}`
          },
          (payload) => {
            console.log('Blocks change:', payload);
            callback(payload);
          }
        );

      // Subscribe with better error handling
      const subscription = await new Promise<any>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;
        
        channel.subscribe((status, err) => {
          console.log(`Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeoutId);
            console.log('✅ Successfully subscribed to basket:', basketId);
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeoutId);
            console.error('❌ Channel error:', err);
            
            // Common causes and solutions
            console.log('Troubleshooting:');
            console.log('1. Check RLS policies: Ensure user has SELECT permission');
            console.log('2. Check table exists in supabase_realtime publication');
            console.log('3. Verify authentication token is valid');
            
            reject(new Error(`Subscription failed: ${err?.message || 'Unknown error'}`));
          } else if (status === 'TIMED_OUT') {
            clearTimeout(timeoutId);
            console.error('⏱️ Subscription timed out');
            reject(new Error('Subscription timed out'));
          }
        });
        
        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          console.error('Subscription timeout - no response after 10s');
          reject(new Error('Subscription timeout'));
        }, 10000);
      }).catch(error => {
        console.error('Failed to subscribe:', error);
        return null;
      });
      
      return subscription;
    } catch (error) {
      console.error('Error in subscribeToBasket:', error);
      return null;
    }
  }
}

// Singleton instance
export const substrateService = new SubstrateService();