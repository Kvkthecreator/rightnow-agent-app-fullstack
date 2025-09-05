import 'server-only';

import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';
import type { ReflectionDTO } from '@/shared/contracts/reflections';

export interface ReflectionComputationOptions {
  computation_trace_id?: string;
  substrate_window_hours?: number;
  force_refresh?: boolean;
}

export interface SubstrateWindow {
  start_timestamp: string;
  end_timestamp: string;
  dump_count: number;
  total_tokens: number;
  substrate_content: string;
}

export class ReflectionEngine {
  private supabase;

  constructor() {
    this.supabase = createRouteHandlerClient({ cookies });
  }

  async computeReflection(
    basket_id: string,
    workspace_id: string,
    options: ReflectionComputationOptions = {}
  ): Promise<ReflectionDTO | null> {
    const computation_trace_id = options.computation_trace_id || crypto.randomUUID();
    const window_hours = options.substrate_window_hours || 24;
    const force_refresh = options.force_refresh || false;

    // Get substrate window
    const window = await this.getSubstrateWindow(basket_id, window_hours, workspace_id);
    const substrate_hash = this.computeSubstrateHash(window.substrate_content);

    // Check cache first if not forcing refresh
    if (!force_refresh) {
      const cached = await this.getCachedReflection(basket_id, substrate_hash);
      if (cached) {
        // Update last accessed timestamp
        // Note: reflections_artifact doesn't have last_accessed_at
        // Reflections are now durable artifacts, not cache
        return cached;
      }
    }

    // Rate limit check (60s between computes)
    const rateLimitOk = await this.checkRateLimit(basket_id);
    if (!rateLimitOk && !force_refresh) {
      // Return existing cache if rate limited
      return await this.getMostRecentReflection(basket_id);
    }

    // Try to acquire advisory lock
    const lockAcquired = await this.tryAcquireLock(basket_id);
    if (!lockAcquired) {
      // Another process is computing, return existing cache
      return await this.getMostRecentReflection(basket_id);
    }

    try {
      // Compute reflection
      const reflection_text = await this.generateReflection(window.substrate_content);
      
      // Use new artifact creation function
      const { data: reflection_id, error } = await this.supabase
        .rpc('fn_reflection_create_from_substrate', {
          p_basket_id: basket_id,
          p_reflection_text: reflection_text
        });

      if (error) {
        throw new Error(`Failed to store reflection: ${error.message}`);
      }

      // Get the created reflection for return
      const { data: reflection, error: fetchError } = await this.supabase
        .from('reflections_artifact')
        .select('*')
        .eq('id', reflection_id)
        .single();
        
      if (fetchError || !reflection) {
        throw new Error('Failed to fetch created reflection');
      }

      return {
        id: reflection.id,
        basket_id: reflection.basket_id,
        workspace_id: reflection.workspace_id,
        reflection_text: reflection.reflection_text,
        substrate_window_start: reflection.substrate_window_start,
        substrate_window_end: reflection.substrate_window_end,
        computation_timestamp: reflection.computation_timestamp,
        reflection_target_type: 'legacy' as const,  // v2.0 required field
        meta: reflection.meta,
      };
    } finally {
      await this.releaseLock(basket_id);
    }
  }

  async getReflections(
    basket_id: string,
    workspace_id: string,
    cursor?: string,
    limit: number = 10,
    refresh?: boolean
  ): Promise<{ reflections: ReflectionDTO[]; has_more: boolean; next_cursor?: string }> {
    // If refresh requested, compute new reflection first
    if (refresh) {
      await this.computeReflection(basket_id, workspace_id, { force_refresh: true });
    }

    let query = this.supabase
      .from('reflections_artifact')
      .select('*')
      .eq('basket_id', basket_id)
      .eq('workspace_id', workspace_id)
      .order('computation_timestamp', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('computation_timestamp', cursor);
    }

    const { data: reflections, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reflections: ${error.message}`);
    }

    const has_more = reflections.length > limit;
    const results = has_more ? reflections.slice(0, limit) : reflections;
    const next_cursor = has_more ? results[results.length - 1].computation_timestamp : undefined;

    // Note: No last_accessed tracking in reflections_artifact
    // Reflections are durable artifacts, not cache entries

    return {
      reflections: results.map(r => ({
        id: r.id,
        basket_id: r.basket_id,
        workspace_id: r.workspace_id,
        reflection_text: r.reflection_text,
        reflection_target_type: r.reflection_target_type || 'legacy',
        reflection_target_id: r.reflection_target_id,
        reflection_target_version: r.reflection_target_version,
        substrate_window_start: r.substrate_window_start,
        substrate_window_end: r.substrate_window_end,
        computation_timestamp: r.computation_timestamp,
        meta: r.meta,
      })),
      has_more,
      next_cursor,
    };
  }

  private async getSubstrateWindow(
    basket_id: string, 
    window_hours: number,
    workspace_id?: string
  ): Promise<SubstrateWindow> {
    const end_timestamp = new Date().toISOString();
    const start_timestamp = new Date(Date.now() - window_hours * 60 * 60 * 1000).toISOString();

    let query = this.supabase
      .from('raw_dumps')
      .select('body_md, metadata, created_at')
      .eq('basket_id', basket_id)
      .gte('created_at', start_timestamp)
      .lte('created_at', end_timestamp)
      .order('created_at', { ascending: true });

    // Add workspace isolation if provided
    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    const { data: dumps, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch substrate window: ${error.message}`);
    }

    const substrate_content = dumps
      .map(dump => dump.body_md || `[Dump from ${dump.created_at}]`)
      .join('\n\n---\n\n');

    const total_tokens = this.estimateTokens(substrate_content);

    return {
      start_timestamp,
      end_timestamp,
      dump_count: dumps.length,
      total_tokens,
      substrate_content,
    };
  }

  private async generateReflection(substrate_content: string): Promise<string> {
    // Placeholder for reflection generation logic
    // In production, this would call an LLM service to analyze the substrate
    const reflection_text = `Reflection based on ${substrate_content.length} characters of substrate content. This is a computed summary of recent activity and insights.`;
    
    return reflection_text;
  }

  private async emitReflectionEvent(
    basket_id: string,
    reflection_id: string,
    computation_trace_id: string
  ): Promise<void> {
    // Get workspace_id for the basket
    const { data: basket } = await this.supabase
      .from('baskets')
      .select('workspace_id')
      .eq('id', basket_id)
      .single();

    if (!basket) return;

    const { error } = await this.supabase
      .from('events')
      .insert({
        basket_id,
        workspace_id: basket.workspace_id,
        kind: 'reflection.computed',
        payload: {
          reflection_id,
          computation_trace_id,
        },
        origin: 'system',
        ts: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to emit reflection timeline event:', error);
    }
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (roughly 4 characters per token)
    return Math.ceil(text.length / 4);
  }

  private computeSubstrateHash(substrate_content: string): string {
    return crypto.createHash('sha256').update(substrate_content).digest('hex');
  }

  private async getCachedReflection(
    basket_id: string,
    substrate_hash: string
  ): Promise<ReflectionDTO | null> {
    const { data, error } = await this.supabase
      .from('reflections_artifact')
      .select('*')
      .eq('basket_id', basket_id)
      .eq('substrate_hash', substrate_hash)
      .eq('reflection_target_type', 'substrate')
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      basket_id: data.basket_id,
      workspace_id: data.workspace_id,
      reflection_text: data.reflection_text,
      reflection_target_type: data.reflection_target_type,
      reflection_target_id: data.reflection_target_id,
      reflection_target_version: data.reflection_target_version,
      substrate_window_start: data.substrate_window_start,
      substrate_window_end: data.substrate_window_end,
      computation_timestamp: data.computation_timestamp,
      meta: data.meta,
    };
  }

  private async getMostRecentReflection(basket_id: string): Promise<ReflectionDTO | null> {
    const { data, error } = await this.supabase
      .from('reflections_artifact')
      .select('*')
      .eq('basket_id', basket_id)
      .order('computation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      basket_id: data.basket_id,
      workspace_id: data.workspace_id,
      reflection_text: data.reflection_text,
      reflection_target_type: data.reflection_target_type || 'legacy',
      reflection_target_id: data.reflection_target_id,
      reflection_target_version: data.reflection_target_version,
      substrate_window_start: data.substrate_window_start,
      substrate_window_end: data.substrate_window_end,
      computation_timestamp: data.computation_timestamp,
      meta: data.meta,
    };
  }

  private async checkRateLimit(basket_id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('reflection_cache')
      .select('computation_timestamp')
      .eq('basket_id', basket_id)
      .order('computation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return true; // No previous compute

    const lastCompute = new Date(data.computation_timestamp).getTime();
    const now = Date.now();
    const sixtySecondsAgo = now - 60000;

    return lastCompute < sixtySecondsAgo;
  }

  private async tryAcquireLock(basket_id: string): Promise<boolean> {
    // Simplified lock mechanism - check if another computation is in progress
    const { data } = await this.supabase
      .from('reflection_cache')
      .select('computation_timestamp')
      .eq('basket_id', basket_id)
      .order('computation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return true; // No previous computation

    const lastCompute = new Date(data.computation_timestamp).getTime();
    const now = Date.now();
    const twoMinutesAgo = now - 120000; // 2 minutes

    // Allow if last computation was more than 2 minutes ago
    return lastCompute < twoMinutesAgo;
  }

  private async releaseLock(basket_id: string): Promise<void> {
    // Advisory transaction locks are automatically released at transaction end
    // This is a no-op but kept for clarity
  }
}