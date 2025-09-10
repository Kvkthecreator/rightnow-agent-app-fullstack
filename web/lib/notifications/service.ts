/**
 * YARNNN Unified Notification Service - Canon v1.0.0 Compliant
 * 
 * Central service for creating, managing, and routing notifications.
 * Replaces all legacy notification systems with unified approach.
 */

import { useNotificationStore } from './store';
import { CreateNotificationRequest, NotificationType } from './types';

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  
  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }
  
  /**
   * Create a new notification
   */
  notify(request: CreateNotificationRequest): string {
    const store = useNotificationStore.getState();
    return store.addNotification(request);
  }
  
  /**
   * Convenience methods for common notification patterns
   */
  
  // Substrate notifications
  substrateCreated(title: string, message: string, substrate_ids?: string[], basket_id?: string) {
    return this.notify({
      type: 'substrate.block.created',
      title,
      message,
      severity: 'info',
      channels: ['toast', 'badge'],
      related_entities: { substrate_ids, basket_id }
    });
  }
  
  substrateApproved(title: string, message: string, substrate_ids?: string[], basket_id?: string) {
    return this.notify({
      type: 'substrate.block.approved',
      title,
      message,
      severity: 'success',
      channels: ['toast'],
      persistence: { auto_dismiss: 5, cross_page: false },
      related_entities: { substrate_ids, basket_id }
    });
  }
  
  substrateRejected(title: string, message: string, substrate_ids?: string[], basket_id?: string) {
    return this.notify({
      type: 'substrate.block.rejected',
      title,
      message,
      severity: 'error',
      channels: ['toast', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true },
      related_entities: { substrate_ids, basket_id }
    });
  }
  
  // Presentation layer notifications
  documentComposed(title: string, message: string, document_id?: string, substrate_count?: number) {
    return this.notify({
      type: 'presentation.document.composed',
      title,
      message,
      severity: 'success',
      channels: ['toast'],
      persistence: { auto_dismiss: 5, cross_page: false },
      related_entities: { document_id },
      actions: document_id ? [{
        label: 'View Document',
        variant: 'primary',
        handler: () => {
          window.location.href = `/documents/${document_id}`;
        }
      }] : undefined
    });
  }
  
  documentCompositionFailed(title: string, message: string, document_id?: string) {
    return this.notify({
      type: 'presentation.document.composition_failed',
      title,
      message,
      severity: 'error',
      channels: ['toast', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true },
      related_entities: { document_id },
      actions: [{
        label: 'Retry',
        variant: 'primary',
        handler: async () => {
          // TODO: Implement retry logic
          console.log('Retrying composition for', document_id);
        }
      }]
    });
  }
  
  documentImpactReady(title: string, message: string, document_ids?: string[]) {
    return this.notify({
      type: 'presentation.document.impact_ready',
      title,
      message,
      severity: 'info',
      channels: ['badge', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true },
      actions: [{
        label: 'Review Impacts',
        variant: 'primary',
        handler: () => {
          // TODO: Open document impact checkpoint
          console.log('Opening impact review');
        }
      }]
    });
  }
  
  // Work orchestration notifications
  workCompleted(title: string, message: string, work_id?: string) {
    return this.notify({
      type: 'work.completed',
      title,
      message,
      severity: 'success',
      channels: ['toast'],
      persistence: { auto_dismiss: 5, cross_page: false },
      related_entities: { work_id }
    });
  }
  
  workFailed(title: string, message: string, work_id?: string) {
    return this.notify({
      type: 'work.failed',
      title,
      message,
      severity: 'error',
      channels: ['toast', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true },
      related_entities: { work_id },
      actions: [{
        label: 'View Details',
        variant: 'secondary',
        handler: () => {
          // TODO: Show work failure details
          console.log('Showing work failure details', work_id);
        }
      }]
    });
  }
  
  // Governance notifications
  approvalRequired(title: string, message: string, basket_id?: string) {
    return this.notify({
      type: 'governance.approval.required',
      title,
      message,
      severity: 'warning',
      channels: ['badge', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true, requires_acknowledgment: true },
      related_entities: { basket_id },
      governance_context: {
        requires_approval: true,
        auto_approvable: false,
        smart_review_eligible: true,
        permission_level: 'admin'
      }
    });
  }
  
  // System notifications
  userJoinedWorkspace(userEmail: string, workspace_id: string) {
    return this.notify({
      type: 'system.user.joined_workspace',
      title: 'User Joined',
      message: `${userEmail} joined the workspace`,
      severity: 'info',
      channels: ['toast'],
      persistence: { auto_dismiss: 4, cross_page: false }
    });
  }
  
  conflictDetected(title: string, message: string, document_id?: string) {
    return this.notify({
      type: 'system.conflict.detected',
      title,
      message,
      severity: 'warning',
      channels: ['toast', 'persistent'],
      persistence: { auto_dismiss: false, cross_page: true },
      related_entities: { document_id },
      actions: [{
        label: 'Resolve',
        variant: 'primary',
        handler: () => {
          // TODO: Open conflict resolution UI
          console.log('Opening conflict resolution');
        }
      }]
    });
  }
  
  /**
   * Legacy migration helpers - gradually replace these calls
   */
  
  // Migrate from react-hot-toast
  migrateToast(type: 'success' | 'error' | 'info', message: string, context?: any) {
    let notificationType: NotificationType;
    let severity: 'success' | 'error' | 'info' = type;
    
    // Smart mapping based on message content
    if (type === 'success') {
      if (message.includes('Block') || message.includes('Context')) {
        notificationType = 'substrate.block.approved';
      } else if (message.includes('Document') || message.includes('composed')) {
        notificationType = 'presentation.document.composed';
      } else {
        notificationType = 'work.completed';
      }
    } else if (type === 'error') {
      if (message.includes('Block') || message.includes('Context')) {
        notificationType = 'substrate.block.rejected';
      } else if (message.includes('Document') || message.includes('composition')) {
        notificationType = 'presentation.document.composition_failed';
      } else {
        notificationType = 'work.failed';
      }
    } else {
      notificationType = 'governance.approval.required';
    }
    
    return this.notify({
      type: notificationType,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      severity,
      channels: ['toast'],
      persistence: { auto_dismiss: type === 'error' ? false : 5, cross_page: false }
    });
  }
  
  // Migrate from RealTimeNotifications custom events
  migrateRealTimeEvent(eventType: string, data: any) {
    let notificationType: NotificationType;
    let title: string;
    let message: string;
    
    switch (eventType) {
      case 'change_applied':
        notificationType = 'substrate.block.approved';
        title = 'Change Applied';
        message = data.message || 'Your change was applied successfully';
        break;
      case 'change_failed':
        notificationType = 'substrate.block.rejected';
        title = 'Change Failed';
        message = data.message || 'Your change could not be applied';
        break;
      case 'conflict_detected':
        notificationType = 'system.conflict.detected';
        title = 'Conflict Detected';
        message = data.message || 'Multiple users are editing the same content';
        break;
      case 'user_joined':
        notificationType = 'system.user.joined_workspace';
        title = 'User Joined';
        message = data.message || 'Someone joined the workspace';
        break;
      default:
        return '';
    }
    
    return this.notify({
      type: notificationType,
      title,
      message,
      channels: ['toast']
    });
  }
  
  /**
   * Broadcast notification to all clients in workspace
   */
  async broadcast(request: CreateNotificationRequest) {
    const store = useNotificationStore.getState();
    const { workspace_id, realtime_channel } = store;
    
    if (!workspace_id || !realtime_channel) {
      console.warn('Cannot broadcast notification without workspace context or real-time connection');
      return '';
    }
    
    // Add to local store first
    const id = this.notify(request);
    
    // Broadcast to other clients
    await realtime_channel.send({
      type: 'broadcast',
      event: 'notification',
      notification: request
    });
    
    return id;
  }
  
  /**
   * Get store instance for component usage
   */
  getStore() {
    return useNotificationStore;
  }
}

// Export singleton instance
export const notificationService = UnifiedNotificationService.getInstance();

// Convenience hooks for React components
export { useNotificationStore };

// Legacy compatibility exports
export const legacyNotify = {
  success: (message: string) => notificationService.migrateToast('success', message),
  error: (message: string) => notificationService.migrateToast('error', message),
  info: (message: string) => notificationService.migrateToast('info', message)
};