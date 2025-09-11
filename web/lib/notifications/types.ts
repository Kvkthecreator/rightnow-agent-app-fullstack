/**
 * YARNNN Unified Notification Types - Canon v1.0.0 Compliant
 * 
 * Sacred canonical types for the unified notification architecture.
 * All notification components must use these types exclusively.
 */

export type NotificationType = 
  // ── Substrate Layer (P1-P3) - Governance Bound ──
  | 'substrate.block.created'
  | 'substrate.block.approved' 
  | 'substrate.block.rejected'
  | 'substrate.context_item.created'
  | 'substrate.context_item.approved'
  | 'substrate.context_item.rejected'
  | 'substrate.dump.processed'
  | 'substrate.dump.processing'
  | 'substrate.dump.rejected'
  | 'substrate.relationships.mapped'
  
  // ── Artifact: Reflections (P3) ──
  | 'reflection.computed'
  
  // ── Presentation Layer (P4) - User Experience ──
  | 'presentation.document.composed'
  | 'presentation.document.impact_ready'
  | 'presentation.document.composition_failed'
  
  // ── Work Orchestration - System Operations ──
  | 'work.queued'
  | 'work.processing'
  | 'work.completed'
  | 'work.failed'
  | 'work.cascade.initiated'
  | 'work.cascade.completed'
  
  // ── Governance & Smart Approval ──
  | 'governance.approval.required'
  | 'governance.approval.batch_ready'
  | 'governance.settings.changed'
  | 'governance.smart_review.completed'
  | 'governance.permissions.changed'
  
  // ── System & Collaboration ──
  | 'system.user.joined_workspace'
  | 'system.user.left_workspace' 
  | 'system.user.editing_document'
  | 'system.user.action_required'
  | 'system.conflict.detected'
  | 'system.performance.alert';

export type NotificationCategory = 'substrate' | 'presentation' | 'work' | 'governance' | 'system';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'acknowledged';
export type NotificationChannel = 'toast' | 'badge' | 'persistent' | 'modal' | 'drawer';

export interface NotificationAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'destructive';
  handler: () => void | Promise<void>;
  icon?: string;
}

export interface NotificationGovernanceContext {
  requires_approval: boolean;
  auto_approvable: boolean;
  smart_review_eligible: boolean;
  permission_level: 'viewer' | 'editor' | 'admin';
}

export interface NotificationPersistence {
  cross_page: boolean;
  auto_dismiss: boolean | number; // false, true, or seconds
  requires_acknowledgment: boolean;
}

export interface NotificationRelatedEntities {
  basket_id?: string;
  document_id?: string;
  reflection_id?: string;
  substrate_ids?: string[];
  work_id?: string;
}

export interface UnifiedNotification {
  // Identity
  id: string;
  workspace_id: string;
  user_id: string;
  
  // Classification (Canon-compliant)
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  
  // Content
  title: string;
  message: string;
  timestamp: string;
  
  // Governance Integration
  governance_context: NotificationGovernanceContext;
  
  // Routing & Display
  channels: NotificationChannel[];
  persistence: NotificationPersistence;
  
  // Interactions
  actions?: NotificationAction[];
  related_entities: NotificationRelatedEntities;
  
  // State tracking
  status: NotificationStatus;
  read_at?: string;
  dismissed_at?: string;
  acknowledged_at?: string;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  channels?: NotificationChannel[];
  persistence?: Partial<NotificationPersistence>;
  actions?: Omit<NotificationAction, 'id'>[];
  related_entities?: NotificationRelatedEntities;
  governance_context?: Partial<NotificationGovernanceContext>;
}

export interface NotificationGovernance {
  workspace_id: string;
  
  // Substrate notification controls
  substrate_notifications: {
    enabled: boolean;
    filter: 'all' | 'approvals_only' | 'high_confidence_only';
    batch_low_priority: boolean;
    smart_approval_integration: boolean;
  };
  
  // Presentation layer controls  
  presentation_notifications: {
    enabled: boolean;
    document_composition: boolean;
    document_impacts: boolean;
    cross_page_persist: boolean;
  };
  
  // Work queue controls
  work_notifications: {
    enabled: boolean;
    show_all_workspace_work: boolean;
    cascade_notifications: boolean;
    failure_alerts: boolean;
  };
  
  // User experience settings
  ui_preferences: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    max_visible: number;
    auto_dismiss_delay: number;
    sound_enabled: boolean;
    badge_counts: boolean;
  };
  
  // Permission-based routing
  role_based_routing: {
    admin_escalations: boolean;
    collaborator_mentions: boolean;
    governance_alerts: boolean;
  };
}

