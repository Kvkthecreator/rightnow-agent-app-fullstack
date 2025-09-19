/**
 * Alert Emitter - Canon v3.0
 * 
 * Helper functions to emit user alerts
 * For real-time actionable items requiring user attention
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AlertType = 
  | 'approval.required'
  | 'decision.needed'
  | 'error.attention'
  | 'processing.completed'
  | 'document.ready'
  | 'insights.available'
  | 'governance.updated'
  | 'collaboration.update'
  | 'system.maintenance'
  | 'system.performance'
  | 'system.security'
  | 'system.storage';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

interface EmitUserAlertParams {
  userId: string;
  workspaceId: string;
  alertType: AlertType;
  title: string;
  message: string;
  severity?: AlertSeverity;
  actionable?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntities?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Emit a user alert
 */
export async function emitUserAlert({
  userId,
  workspaceId,
  alertType,
  title,
  message,
  severity = 'info',
  actionable = false,
  actionUrl,
  actionLabel,
  relatedEntities = {},
  expiresAt
}: EmitUserAlertParams): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient() as any;
    
    const { data, error } = await supabase.rpc('emit_user_alert', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_alert_type: alertType,
      p_title: title,
      p_message: message,
      p_severity: severity,
      p_actionable: actionable,
      p_action_url: actionUrl,
      p_action_label: actionLabel,
      p_related_entities: relatedEntities,
      p_expires_at: expiresAt?.toISOString()
    });

    if (error) {
      console.error('User alert emission failed:', error);
      return null;
    }

    return data; // Returns the alert ID
  } catch (error) {
    console.error('User alert emission error:', error);
    return null;
  }
}

/**
 * Convenience functions for common alert types
 */

export async function emitApprovalRequired(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    proposalId?: string;
    actionUrl: string;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'approval.required',
    title: options.title,
    message: options.message,
    severity: 'warning',
    actionable: true,
    actionUrl: options.actionUrl,
    actionLabel: 'Review Proposal',
    relatedEntities: options.proposalId ? { proposal_id: options.proposalId } : {}
  });
}

export async function emitDecisionNeeded(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    actionUrl: string;
    actionLabel?: string;
    relatedEntities?: Record<string, any>;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'decision.needed',
    title: options.title,
    message: options.message,
    severity: 'warning',
    actionable: true,
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel || 'Take Action',
    relatedEntities: options.relatedEntities || {}
  });
}

export async function emitErrorAttention(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntities?: Record<string, any>;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'error.attention',
    title: options.title,
    message: options.message,
    severity: 'error',
    actionable: !!options.actionUrl,
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel || 'Fix Issue',
    relatedEntities: options.relatedEntities || {}
  });
}

export async function emitProcessingCompleted(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    relatedEntities?: Record<string, any>;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'processing.completed',
    title: options.title,
    message: options.message,
    severity: 'info',
    actionable: !!options.actionUrl,
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel || 'View Results',
    relatedEntities: options.relatedEntities || {}
  });
}

export async function emitDocumentReady(
  userId: string,
  workspaceId: string,
  options: {
    documentId: string;
    title: string;
    basketId: string;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'document.ready',
    title: 'Document ready',
    message: `Your document "${options.title}" has been composed and is ready to view`,
    severity: 'info',
    actionable: true,
    actionUrl: `/baskets/${options.basketId}/documents/${options.documentId}`,
    actionLabel: 'View Document',
    relatedEntities: { 
      document_id: options.documentId,
      basket_id: options.basketId
    }
  });
}

export async function emitInsightsAvailable(
  userId: string,
  workspaceId: string,
  options: {
    reflectionId: string;
    basketId: string;
    insightCount?: number;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'insights.available',
    title: 'New insights available',
    message: options.insightCount 
      ? `${options.insightCount} new insights discovered in your knowledge`
      : 'Fresh insights have been discovered in your knowledge',
    severity: 'info',
    actionable: true,
    actionUrl: `/baskets/${options.basketId}/reflections/${options.reflectionId}`,
    actionLabel: 'Explore Insights',
    relatedEntities: { 
      reflection_id: options.reflectionId,
      basket_id: options.basketId
    }
  });
}

export async function emitGovernanceUpdated(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    basketId?: string;
    actionUrl?: string;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'governance.updated',
    title: options.title,
    message: options.message,
    severity: 'info',
    actionable: !!options.actionUrl,
    actionUrl: options.actionUrl,
    actionLabel: 'View Changes',
    relatedEntities: options.basketId ? { basket_id: options.basketId } : {}
  });
}

export async function emitSystemMaintenance(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    startTime?: Date;
    duration?: string;
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'system.maintenance',
    title: options.title,
    message: options.message,
    severity: 'warning',
    actionable: false,
    relatedEntities: {
      start_time: options.startTime?.toISOString(),
      duration: options.duration
    },
    expiresAt: options.startTime // Auto-expire when maintenance starts
  });
}

export async function emitSystemPerformance(
  userId: string,
  workspaceId: string,
  options: {
    title: string;
    message: string;
    severity?: 'warning' | 'error';
  }
) {
  return emitUserAlert({
    userId,
    workspaceId,
    alertType: 'system.performance',
    title: options.title,
    message: options.message,
    severity: options.severity || 'warning',
    actionable: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire in 24 hours
  });
}