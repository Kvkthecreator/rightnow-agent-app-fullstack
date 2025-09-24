// Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)

import type { AppEvent } from '@/lib/types';
import { createBrowserClient } from '@/lib/supabase/clients';
import { useNotificationStore } from '@/lib/notifications';

class NotificationAPI {
  private supabase = createBrowserClient();
  private subscription: any = null;

  async emitEvent(
    type: AppEvent['type'],
    name: string,
    message: string,
    options: {
      severity?: AppEvent['severity'];
      phase?: AppEvent['phase'];
      basketId?: string;
      entityId?: string;
      correlationId?: string;
      dedupeKey?: string;
      ttlMs?: number;
      payload?: any;
    } = {}
  ): Promise<void> {
    try {
      // Get current user and workspace context
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session?.user) return;

      // Extract workspace from user metadata or use a default
      const workspaceId = session.user.user_metadata?.workspace_id || session.user.id;

      const eventData: Partial<AppEvent> = {
        v: 1,
        type,
        name,
        message,
        severity: options.severity || 'info',
        phase: options.phase,
        workspace_id: workspaceId,
        basket_id: options.basketId,
        entity_id: options.entityId,
        correlation_id: options.correlationId,
        dedupe_key: options.dedupeKey,
        ttl_ms: options.ttlMs,
        payload: options.payload,
      };

      // Remove undefined values
      const cleanedEventData = Object.fromEntries(
        Object.entries(eventData).filter(([_, value]) => value !== undefined)
      );

      await this.supabase
        .from('app_events')
        .insert(cleanedEventData);

    } catch (error) {
      console.warn('Failed to emit app event:', error);
    }
  }

  startRealtimeSubscription(): void {
    if (this.subscription) return;

    this.subscription = this.supabase
      .channel('app_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_events',
        },
        (payload) => {
          const event = payload.new as AppEvent;
          useNotificationStore.getState().addEvent(event);
        }
      )
      .subscribe();
  }

  stopRealtimeSubscription(): void {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  // Convenience methods following Canon patterns
  async emitJobStarted(jobName: string, message: string, options: { basketId?: string; correlationId?: string } = {}) {
    await this.emitEvent('job_update', jobName, message, {
      phase: 'started',
      severity: 'info',
      ...options
    });
  }

  async emitJobSucceeded(jobName: string, message: string, options: { basketId?: string; correlationId?: string; payload?: any } = {}) {
    await this.emitEvent('job_update', jobName, message, {
      phase: 'succeeded',
      severity: 'success',
      ...options
    });
  }

  async emitJobFailed(jobName: string, message: string, options: { basketId?: string; correlationId?: string; error?: string } = {}) {
    await this.emitEvent('job_update', jobName, message, {
      phase: 'failed',
      severity: 'error',
      payload: options.error ? { error: options.error } : undefined,
      basketId: options.basketId,
      correlationId: options.correlationId
    });
  }

  async emitActionResult(actionName: string, message: string, options: { severity?: AppEvent['severity']; payload?: any } = {}) {
    await this.emitEvent('action_result', actionName, message, {
      severity: options.severity || 'success',  // Default to success instead of info for better visibility
      payload: options.payload
    });
  }

  async emitSystemAlert(alertName: string, message: string, severity: AppEvent['severity'] = 'warning') {
    await this.emitEvent('system_alert', alertName, message, { severity });
  }
}

export const notificationAPI = new NotificationAPI();