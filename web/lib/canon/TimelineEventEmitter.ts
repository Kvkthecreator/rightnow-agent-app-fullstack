/**
 * Timeline Event Emitter
 * 
 * Ensures consistent timeline event emission across all pipelines
 * Enforces canonical timeline event format per YARNNN Canon v1.4.0
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TimelineEventKind = 
  // P0: Capture events
  | 'dump.created'
  | 'dump.queued'
  // P1: Substrate events
  | 'block.created'
  | 'block.updated'
  | 'block.state_changed'
  | 'context_item.created'
  | 'context_item.updated'
  // P2: Graph events
  | 'relationship.created'
  | 'relationship.deleted'
  // P3: Reflection events  
  | 'reflection.computed'
  | 'reflection.cached'
  // P4: Presentation events
  | 'document.created'
  | 'document.updated'
  | 'document.composed'
  | 'narrative.authored'
  // Queue processing events
  | 'queue.entry_created'
  | 'queue.processing_started'
  | 'queue.processing_completed'
  | 'queue.processing_failed';

export interface CanonicalTimelineEvent {
  kind: TimelineEventKind;
  basket_id: string;
  workspace_id: string;
  payload: Record<string, any>;
  metadata?: {
    pipeline: string;
    operation?: string;
    user_id?: string;
    trace_id?: string;
  };
}

export class TimelineEventEmitter {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Emit a timeline event with canonical format
   * Ensures append-only, immutable timeline
   */
  async emit(event: CanonicalTimelineEvent): Promise<void> {
    try {
      // Validate event kind matches pipeline
      this.validateEventKind(event);
      
      // Call the Supabase function to emit event (workspace-scoped)
      const { error } = await this.supabase.rpc('emit_timeline_event', {
        p_basket_id: event.basket_id,
        p_event_type: event.kind,
        p_event_data: {
          ...event.payload,
          metadata: event.metadata
        },
        p_workspace_id: event.workspace_id,
        p_actor_id: event.metadata?.user_id || null,
        p_agent_type: event.metadata?.pipeline || null
      });
      
      if (error) {
        console.error('[Timeline Event Error]', {
          kind: event.kind,
          error: error.message,
          basket_id: event.basket_id
        });
        // Don't throw - timeline events should not break operations
        // In production, send to monitoring
      }
    } catch (err) {
      console.error('[Timeline Event Exception]', err);
      // Don't throw - timeline events should not break operations
    }
  }

  /**
   * Batch emit multiple events (for complex operations)
   */
  async emitBatch(events: CanonicalTimelineEvent[]): Promise<void> {
    // Emit events sequentially to maintain order
    for (const event of events) {
      await this.emit(event);
    }
  }

  /**
   * Helper methods for common event patterns
   */
  
  async emitDumpCreated(params: {
    basket_id: string;
    workspace_id: string;
    dump_id: string;
    source_type?: string;
  }): Promise<void> {
    await this.emit({
      kind: 'dump.created',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        dump_id: params.dump_id,
        source_type: params.source_type || 'manual'
      },
      metadata: {
        pipeline: 'P0_CAPTURE'
      }
    });
  }

  async emitDumpQueued(params: {
    basket_id: string;
    workspace_id: string;
    dump_id: string;
    queue_entry_id: string;
  }): Promise<void> {
    await this.emit({
      kind: 'dump.queued',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        dump_id: params.dump_id,
        queue_entry_id: params.queue_entry_id
      },
      metadata: {
        pipeline: 'P0_CAPTURE'
      }
    });
  }

  async emitBlockCreated(params: {
    basket_id: string;
    workspace_id: string;
    block_id: string;
    semantic_type: string;
    source_dump_id?: string;
  }): Promise<void> {
    await this.emit({
      kind: 'block.created',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        block_id: params.block_id,
        semantic_type: params.semantic_type,
        source_dump_id: params.source_dump_id
      },
      metadata: {
        pipeline: 'P1_SUBSTRATE'
      }
    });
  }

  async emitBlockStateChanged(params: {
    basket_id: string;
    workspace_id: string;
    block_id: string;
    old_state: string;
    new_state: string;
  }): Promise<void> {
    await this.emit({
      kind: 'block.state_changed',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        block_id: params.block_id,
        old_state: params.old_state,
        new_state: params.new_state,
        transition: `${params.old_state} → ${params.new_state}`
      },
      metadata: {
        pipeline: 'P1_SUBSTRATE'
      }
    });
  }

  async emitRelationshipCreated(params: {
    basket_id: string;
    workspace_id: string;
    relationship_id: string;
    from_id: string;
    to_id: string;
    relationship_type: string;
  }): Promise<void> {
    await this.emit({
      kind: 'relationship.created',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        relationship_id: params.relationship_id,
        from_id: params.from_id,
        to_id: params.to_id,
        relationship_type: params.relationship_type
      },
      metadata: {
        pipeline: 'P2_GRAPH'
      }
    });
  }

  async emitReflectionComputed(params: {
    basket_id: string;
    workspace_id: string;
    reflection_type: string;
    source_count: number;
    cached?: boolean;
  }): Promise<void> {
    await this.emit({
      kind: params.cached ? 'reflection.cached' : 'reflection.computed',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        reflection_type: params.reflection_type,
        source_count: params.source_count,
        computation_time_ms: Date.now()
      },
      metadata: {
        pipeline: 'P3_REFLECTION'
      }
    });
  }

  async emitDocumentComposed(params: {
    basket_id: string;
    workspace_id: string;
    document_id: string;
    substrate_count: number;
    substrate_types: string[];
  }): Promise<void> {
    await this.emit({
      kind: 'document.composed',
      basket_id: params.basket_id,
      workspace_id: params.workspace_id,
      payload: {
        document_id: params.document_id,
        substrate_count: params.substrate_count,
        substrate_types: params.substrate_types,
        composition_stats: {
          total_references: params.substrate_count,
          unique_types: params.substrate_types.length
        }
      },
      metadata: {
        pipeline: 'P4_PRESENTATION'
      }
    });
  }

  /**
   * Validate event kind matches expected pipeline
   */
  private validateEventKind(event: CanonicalTimelineEvent): void {
    const pipeline = event.metadata?.pipeline;
    if (!pipeline) return; // No validation if pipeline not specified
    
    const pipelineEvents: Record<string, TimelineEventKind[]> = {
      'P0_CAPTURE': ['dump.created', 'dump.queued'],
      'P1_SUBSTRATE': ['block.created', 'block.updated', 'block.state_changed', 'context_item.created', 'context_item.updated'],
      'P2_GRAPH': ['relationship.created', 'relationship.deleted'],
      'P3_REFLECTION': ['reflection.computed', 'reflection.cached'],
      'P4_PRESENTATION': ['document.created', 'document.updated', 'document.composed', 'narrative.authored']
    };
    
    const allowedEvents = pipelineEvents[pipeline];
    if (allowedEvents && !allowedEvents.includes(event.kind)) {
      console.warn(`[Timeline Warning] Event ${event.kind} unexpected for pipeline ${pipeline}`);
    }
  }
}

// Factory function for API routes
export function createTimelineEmitter(supabase: SupabaseClient): TimelineEventEmitter {
  return new TimelineEventEmitter(supabase);
}