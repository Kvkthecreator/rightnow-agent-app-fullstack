// Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppEvent } from '@/lib/api/middleware';

/**
 * Emit an app event to the app_events table for realtime distribution
 */
export async function emitAppEvent(params: {
  workspace_id: string;
  type: AppEvent['type'];
  name: string;
  message: string;
  severity?: AppEvent['severity'];
  phase?: AppEvent['phase'];
  basket_id?: string;
  entity_id?: string;
  correlation_id?: string;
  dedupe_key?: string;
  ttl_ms?: number;
  payload?: Record<string, any>;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  const event = {
    v: 1,
    type: params.type,
    name: params.name,
    message: params.message,
    severity: params.severity || 'info',
    phase: params.phase,
    workspace_id: params.workspace_id,
    basket_id: params.basket_id,
    entity_id: params.entity_id,
    correlation_id: params.correlation_id,
    dedupe_key: params.dedupe_key,
    ttl_ms: params.ttl_ms,
    payload: params.payload,
  };

  const { error } = await supabase
    .from('app_events')
    .insert(event);

  if (error) {
    console.error('Failed to emit app event:', error);
  }
}