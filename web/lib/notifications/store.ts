/**
 * YARNNN Unified Notification Store - Canon v1.0.0 Compliant
 * 
 * Zustand store with Supabase persistence for cross-page notification state.
 * Integrates with workspace governance and real-time subscriptions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBrowserClient } from '@/lib/supabase/clients';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  UnifiedNotification,
  CreateNotificationRequest,
  NotificationGovernance,
  NotificationCategory,
  NotificationChannel,
  NotificationType
} from './types';

// Feature flags
const PERSIST_ENABLED = process.env.NEXT_PUBLIC_NOTIFICATIONS_PERSIST_ENABLED === 'true';

interface NotificationStore {
  // Core state
  notifications: UnifiedNotification[];
  workspace_id: string | null;
  user_id: string | null;
  
  // Governance settings
  governance: NotificationGovernance | null;
  
  // Real-time connection
  realtime_channel: RealtimeChannel | null;
  connection_status: 'connecting' | 'connected' | 'error' | 'disconnected';
  
  // Actions
  setWorkspace: (workspace_id: string, user_id: string) => void;
  addNotification: (request: CreateNotificationRequest) => string;
  updateNotification: (id: string, updates: Partial<UnifiedNotification>) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  acknowledgeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Governance
  updateGovernance: (governance: Partial<NotificationGovernance>) => void;
  
  // Filtering & querying
  getNotificationsByCategory: (category: NotificationCategory) => UnifiedNotification[];
  getUnreadCount: () => number;
  getBadgeCount: (channel: NotificationChannel) => number;
  hasPendingWork: () => boolean;
  
  // Persistence & sync
  hydrate: (workspace_id: string, user_id: string) => Promise<void>;
  sync: () => Promise<void>;
  
  // Real-time subscriptions
  initializeRealtime: () => Promise<void>;
  disconnectRealtime: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      workspace_id: null,
      user_id: null,
      governance: null,
      realtime_channel: null,
      connection_status: 'disconnected',
      
      // Set workspace context
      setWorkspace: (workspace_id: string, user_id: string) => {
        // Set context and prune any legacy notifications from other workspaces
        set(state => ({ 
          workspace_id, 
          user_id,
          notifications: state.notifications.filter(n => !n.workspace_id || n.workspace_id === workspace_id)
        }));
        if (PERSIST_ENABLED) {
          get().hydrate(workspace_id, user_id);
        }
        get().initializeRealtime();
      },
      
      // Add new notification
      addNotification: (request: CreateNotificationRequest) => {
        const { workspace_id, user_id, governance } = get();
        
        if (!workspace_id || !user_id) {
          console.warn('Cannot add notification without workspace context');
          return '';
        }
        
        // Apply governance filtering
        if (governance && !shouldShowNotification(request, governance)) {
          return '';
        }
        
        const notification: UnifiedNotification = {
          id: crypto.randomUUID(),
          workspace_id,
          user_id,
          timestamp: new Date().toISOString(),
          
          // From request
          type: request.type,
          title: request.title,
          message: request.message,
          category: getCategoryFromType(request.type),
          severity: request.severity || getDefaultSeverity(request.type),
          channels: request.channels || getDefaultChannels(request.type),
          persistence: {
            cross_page: request.persistence?.cross_page ?? true,
            auto_dismiss: request.persistence?.auto_dismiss ?? getDefaultAutoDismiss(request.type),
            requires_acknowledgment: request.persistence?.requires_acknowledgment ?? false
          },
          actions: request.actions?.map(action => ({
            ...action,
            id: crypto.randomUUID()
          })),
          related_entities: request.related_entities || {},
          governance_context: {
            requires_approval: false,
            auto_approvable: true,
            smart_review_eligible: false,
            permission_level: 'editor',
            ...request.governance_context
          },
          
          // State
          status: 'unread'
        };
        
        set(state => ({
          notifications: [notification, ...state.notifications]
            .slice(0, governance?.ui_preferences?.max_visible || 50) // Limit stored notifications
        }));
        
        // Auto-dismiss if configured
        if (typeof notification.persistence.auto_dismiss === 'number') {
          setTimeout(() => {
            get().dismissNotification(notification.id);
          }, notification.persistence.auto_dismiss * 1000);
        } else if (notification.persistence.auto_dismiss === true) {
          setTimeout(() => {
            get().dismissNotification(notification.id);
          }, governance?.ui_preferences?.auto_dismiss_delay || 5000);
        }
        
        // Sync to Supabase for cross-device persistence
        get().sync();
        
        return notification.id;
      },
      
      // Dismiss notification
      dismissNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id 
              ? { ...n, status: 'dismissed' as const, dismissed_at: new Date().toISOString() }
              : n
          )
        }));
        get().sync();
      },
      
      // Mark as read
      markAsRead: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id && n.status === 'unread'
              ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
              : n
          )
        }));
        get().sync();
      },
      
      // Acknowledge notification (for critical notifications)
      acknowledgeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id 
              ? { ...n, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString() }
              : n
          )
        }));
        get().sync();
      },

      updateNotification: (id: string, updates: Partial<UnifiedNotification>) => {
        set(state => ({
          notifications: state.notifications.map(n => {
            if (n.id !== id) return n;

            const merged: UnifiedNotification = {
              ...n,
              ...updates,
              related_entities: updates.related_entities
                ? { ...n.related_entities, ...updates.related_entities }
                : n.related_entities,
              persistence: updates.persistence
                ? { ...n.persistence, ...updates.persistence }
                : n.persistence,
              governance_context: updates.governance_context
                ? { ...n.governance_context, ...updates.governance_context }
                : n.governance_context,
            };

            return merged;
          })
        }));
        get().sync();
      },
      
      // Clear all notifications
      clearAll: () => {
        set({ notifications: [] });
        get().sync();
      },
      
      // Update governance settings
      updateGovernance: (governance: Partial<NotificationGovernance>) => {
        set(state => ({
          governance: state.governance 
            ? { ...state.governance, ...governance }
            : null
        }));
      },
      
      // Query notifications by category
      getNotificationsByCategory: (category: NotificationCategory) => {
        return get().notifications.filter(n => 
          n.category === category && n.status !== 'dismissed'
        );
      },
      
      // Get unread count
      getUnreadCount: () => {
        return get().notifications.filter(n => 
          n.status === 'unread'
        ).length;
      },
      
      // Get badge count for specific channel
      getBadgeCount: (channel: NotificationChannel) => {
        return get().notifications.filter(n => 
          n.channels.includes(channel) && 
          (n.status === 'unread' || n.persistence.requires_acknowledgment)
        ).length;
      },

      hasPendingWork: () => {
        return get().notifications.some(n =>
          n.category === 'work' &&
          ['work.queued', 'work.processing', 'work.cascade.initiated'].includes(n.type) &&
          n.status !== 'dismissed'
        );
      },
      
      // Hydrate from Supabase
      hydrate: async (workspace_id: string, user_id: string) => {
        if (!PERSIST_ENABLED) return; // Skip DB hydration when persistence disabled
        try {
          const supabase = createBrowserClient();
          
          // Load governance settings
          const { data: governanceData } = await supabase
            .from('workspace_notification_settings')
            .select('*')
            .eq('workspace_id', workspace_id)
            .single();
          
          if (governanceData) {
            set({ governance: governanceData.settings });
          } else {
            // Create default governance settings
            const defaultGovernance = createDefaultGovernance(workspace_id);
            set({ governance: defaultGovernance });
            
            await supabase
              .from('workspace_notification_settings')
              .insert({
                workspace_id,
                settings: defaultGovernance,
                updated_by: user_id
              });
          }
          
          // Load persisted notifications
          const { data: notificationData } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('workspace_id', workspace_id)
            .eq('user_id', user_id)
            .eq('cross_page_persist', true)
            .neq('status', 'dismissed')
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (notificationData) {
            set({ notifications: notificationData.map(mapFromDatabase) });
          }
          
        } catch (error) {
          console.error('Failed to hydrate notification store:', error);
        }
      },
      
      // Sync to Supabase
      sync: async () => {
        if (!PERSIST_ENABLED) return; // Skip DB sync when persistence disabled
        const { workspace_id, user_id, notifications } = get();
        if (!workspace_id || !user_id) return;

        try {
          // Only persist cross-page notifications
          const persistentNotifications = notifications
            .filter(n => n.persistence.cross_page)
            // Guard against legacy/mismatched workspace entries
            .filter(n => n.workspace_id === workspace_id);

          if (persistentNotifications.length === 0) return;

          // Route writes through server API (service-role) to avoid client RLS issues
          await fetch('/api/notifications/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              notifications: persistentNotifications.map(n => ({
                ...mapToDatabase(n),
                // Enforce correct user/workspace on server even if local cache stale
                user_id: user_id,
                workspace_id: workspace_id,
              }))
            })
          });
        } catch (error) {
          // Silent failure: persistence is best-effort
        }
      },
      
      // Initialize real-time subscriptions
      initializeRealtime: async () => {
        const { workspace_id, user_id, realtime_channel } = get();
        // Gate realtime behind env flag to preserve polling‑only canon
        const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS_REALTIME === 'true';
        if (!realtimeEnabled) return;
        if (!workspace_id || realtime_channel) return;
        
        try {
          set({ connection_status: 'connecting' });
          
          const supabase = createBrowserClient();
          
          const channel = supabase
            .channel(`notifications:${workspace_id}`)
            .on('broadcast', { event: 'notification' }, (payload) => {
              const notification = payload.notification as CreateNotificationRequest;
              if (notification) {
                get().addNotification(notification);
              }
            })
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'user_notifications',
              filter: `workspace_id=eq.${workspace_id}`
            }, (payload) => {
              // Handle database changes from other clients
              if (payload.eventType === 'INSERT' && payload.new) {
                const notification = mapFromDatabase(payload.new as any);
                if (notification.user_id === user_id) {
                  set(state => ({
                    notifications: [notification, ...state.notifications]
                  }));
                }
              }
            })
            .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                set({ connection_status: 'connected' });
              } else if (status === 'CHANNEL_ERROR' || err) {
                set({ connection_status: 'error' });
              }
            });
          
          set({ realtime_channel: channel });
          
        } catch (error) {
          console.error('Failed to initialize realtime:', error);
          set({ connection_status: 'error' });
        }
      },
      
      // Disconnect real-time
      disconnectRealtime: () => {
        const { realtime_channel } = get();
        if (realtime_channel) {
          const supabase = createBrowserClient();
          supabase.removeChannel(realtime_channel);
          set({ realtime_channel: null, connection_status: 'disconnected' });
        }
      }
    }),
    {
      name: 'yarnnn-notifications',
      partialize: (state) => ({
        // Only persist essential state, not real-time connections
        notifications: state.notifications.filter(n => n.persistence.cross_page),
        workspace_id: state.workspace_id,
        user_id: state.user_id,
        governance: state.governance
      }),
    }
  )
);

// Helper functions
function getCategoryFromType(type: NotificationType): NotificationCategory {
  if (type.startsWith('substrate.')) return 'substrate';
  if (type.startsWith('presentation.')) return 'presentation';
  if (type.startsWith('work.')) return 'work';
  if (type.startsWith('governance.')) return 'governance';
  return 'system';
}

function getDefaultSeverity(type: NotificationType): 'info' | 'success' | 'warning' | 'error' | 'critical' {
  if (type.includes('.approved') || type.includes('.completed') || type.includes('.composed')) return 'success';
  if (type.includes('.rejected') || type.includes('.failed')) return 'error';
  if (type.includes('.required') || type.includes('.detected')) return 'warning';
  if (type.includes('.alert') || type.includes('.critical')) return 'critical';
  return 'info';
}

function getDefaultChannels(type: NotificationType): NotificationChannel[] {
  if (type.includes('.failed') || type.includes('.alert')) return ['toast', 'persistent'];
  if (type.includes('.completed') || type.includes('.approved')) return ['toast'];
  if (type.includes('.required')) return ['badge', 'persistent'];
  return ['toast'];
}

function getDefaultAutoDismiss(type: NotificationType): boolean | number {
  if (type.includes('.failed') || type.includes('.required')) return false; // Persistent
  if (type.includes('.completed') || type.includes('.approved')) return 5; // 5 seconds
  return true; // Default auto-dismiss
}

function shouldShowNotification(request: CreateNotificationRequest, governance: NotificationGovernance): boolean {
  const category = getCategoryFromType(request.type);
  
  switch (category) {
    case 'substrate':
      return governance.substrate_notifications.enabled;
    case 'presentation':
      return governance.presentation_notifications.enabled;
    case 'work':
      return governance.work_notifications.enabled;
    default:
      return true; // System and governance notifications always show
  }
}

function createDefaultGovernance(workspace_id: string): NotificationGovernance {
  return {
    workspace_id,
    substrate_notifications: {
      enabled: true,
      filter: 'all',
      batch_low_priority: false,
      smart_approval_integration: true
    },
    presentation_notifications: {
      enabled: true,
      document_composition: true,
      document_impacts: true,
      cross_page_persist: true
    },
    work_notifications: {
      enabled: true,
      show_all_workspace_work: false,
      cascade_notifications: true,
      failure_alerts: true
    },
    ui_preferences: {
      position: 'top-right',
      max_visible: 10,
      auto_dismiss_delay: 5000,
      sound_enabled: false,
      badge_counts: true
    },
    role_based_routing: {
      admin_escalations: true,
      collaborator_mentions: true,
      governance_alerts: true
    }
  };
}

function mapToDatabase(notification: UnifiedNotification): any {
  return {
    id: notification.id,
    workspace_id: notification.workspace_id,
    user_id: notification.user_id,
    type: notification.type,
    category: notification.category,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    channels: notification.channels,
    persistence_settings: notification.persistence,
    actions: notification.actions || [],
    related_entities: notification.related_entities,
    governance_context: notification.governance_context,
    status: notification.status,
    cross_page_persist: notification.persistence.cross_page,
    created_at: notification.timestamp,
    read_at: notification.read_at,
    dismissed_at: notification.dismissed_at,
    acknowledged_at: notification.acknowledged_at
  };
}

function mapFromDatabase(data: any): UnifiedNotification {
  return {
    id: data.id,
    workspace_id: data.workspace_id,
    user_id: data.user_id,
    type: data.type,
    category: data.category,
    severity: data.severity,
    title: data.title,
    message: data.message,
    timestamp: data.created_at,
    channels: data.channels || [],
    persistence: data.persistence_settings || { cross_page: true, auto_dismiss: true, requires_acknowledgment: false },
    actions: data.actions || [],
    related_entities: data.related_entities || {},
    governance_context: data.governance_context || { requires_approval: false, auto_approvable: true, smart_review_eligible: false, permission_level: 'editor' },
    status: data.status,
    read_at: data.read_at,
    dismissed_at: data.dismissed_at,
    acknowledged_at: data.acknowledged_at
  };
}
