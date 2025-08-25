import 'server-only';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ReflectionDTO } from '../../../shared/contracts/reflections';

export interface ReflectionComputationOptions {
  computation_trace_id?: string;
  substrate_window_hours?: number;
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
    options: ReflectionComputationOptions = {}
  ): Promise<ReflectionDTO> {
    const computation_trace_id = options.computation_trace_id || crypto.randomUUID();
    const window_hours = options.substrate_window_hours || 24;

    // Get substrate window (last 24 hours of dumps)
    const window = await this.getSubstrateWindow(basket_id, window_hours);
    
    // Compute reflection using substrate content
    const reflection_text = await this.generateReflection(window.substrate_content);
    
    // Store reflection in database
    const { data: reflection, error } = await this.supabase
      .from('basket_reflections')
      .insert({
        basket_id,
        reflection_text,
        substrate_window_start: window.start_timestamp,
        substrate_window_end: window.end_timestamp,
        computation_timestamp: new Date().toISOString(),
        meta: {
          computation_trace_id,
          substrate_dump_count: window.dump_count,
          substrate_tokens: window.total_tokens,
        },
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to store reflection: ${error.message}`);
    }

    // Emit timeline event for computed reflection
    await this.emitReflectionEvent(basket_id, reflection.id, computation_trace_id);

    return {
      id: reflection.id,
      basket_id: reflection.basket_id,
      reflection_text: reflection.reflection_text,
      substrate_window_start: reflection.substrate_window_start,
      substrate_window_end: reflection.substrate_window_end,
      computation_timestamp: reflection.computation_timestamp,
      meta: reflection.meta,
    };
  }

  async getReflections(
    basket_id: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ reflections: ReflectionDTO[]; has_more: boolean; next_cursor?: string }> {
    let query = this.supabase
      .from('basket_reflections')
      .select('*')
      .eq('basket_id', basket_id)
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

    return {
      reflections: results.map(r => ({
        id: r.id,
        basket_id: r.basket_id,
        reflection_text: r.reflection_text,
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
    window_hours: number
  ): Promise<SubstrateWindow> {
    const end_timestamp = new Date().toISOString();
    const start_timestamp = new Date(Date.now() - window_hours * 60 * 60 * 1000).toISOString();

    const { data: dumps, error } = await this.supabase
      .from('raw_dumps')
      .select('text_dump, file_url, created_at')
      .eq('basket_id', basket_id)
      .gte('created_at', start_timestamp)
      .lte('created_at', end_timestamp)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch substrate window: ${error.message}`);
    }

    const substrate_content = dumps
      .map(dump => dump.text_dump || `[File: ${dump.file_url}]`)
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
    const { error } = await this.supabase
      .from('timeline_events')
      .insert({
        basket_id,
        event_type: 'reflection_computed',
        event_data: {
          reflection_id,
          computation_trace_id,
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to emit reflection timeline event:', error);
    }
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (roughly 4 characters per token)
    return Math.ceil(text.length / 4);
  }
}