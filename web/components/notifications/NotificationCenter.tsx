/**
 * YARNNN Notification Center - Canon v1.0.0 Compliant
 * 
 * Cross-page persistent notification display system.
 * Replaces all legacy notification components with unified approach.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/lib/notifications/store';
import type { UnifiedNotification, NotificationChannel } from '@/lib/notifications/types';
import { NotificationToast } from './NotificationToast';
import { NotificationBadge } from './NotificationBadge';
import { NotificationDrawer } from './NotificationDrawer';
import { PersistentNotifications } from './PersistentNotifications';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/clients';

interface NotificationCenterProps {
  workspace_id?: string;
  user_id?: string;
  className?: string;
}

/**
 * Main Notification Center Component
 * 
 * Orchestrates all notification channels and manages unified state.
 * Automatically initializes workspace context and real-time subscriptions.
 */
export function NotificationCenter({ 
  workspace_id, 
  user_id, 
  className = "" 
}: NotificationCenterProps) {
  const pathname = usePathname();
  const {
    notifications,
    workspace_id: currentWorkspace,
    connection_status,
    governance,
    setWorkspace,
    dismissNotification,
    markAsRead,
    acknowledgeNotification,
    getNotificationsByCategory,
    getBadgeCount
  } = useNotificationStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Listen for drawer toggle events from TopBar
  useEffect(() => {
    const handleToggleDrawer = () => {
      setDrawerOpen(prev => !prev);
    };

    window.addEventListener('notification:toggle-drawer', handleToggleDrawer);
    return () => window.removeEventListener('notification:toggle-drawer', handleToggleDrawer);
  }, []);

  // Auto-detect workspace and user context
  useEffect(() => {
    const initializeContext = async () => {
      // If explicitly provided, use those values
      if (workspace_id && user_id && workspace_id !== currentWorkspace) {
        setWorkspace(workspace_id, user_id);
        return;
      }

      // Auto-detect from current session and route
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          let detectedWorkspaceId = workspace_id;
          
          // Try to extract workspace from current route (basket context)
          if (!detectedWorkspaceId && pathname) {
            const basketMatch = pathname.match(/^\/baskets\/([^/]+)/);
            if (basketMatch) {
              const basketId = basketMatch[1];
              
              // Get workspace from basket
              const { data: basket } = await supabase
                .from('baskets')
                .select('workspace_id')
                .eq('id', basketId)
                .single();
                
              if (basket) {
                detectedWorkspaceId = basket.workspace_id;
              }
            }
          }
          
          // Fallback to user's default workspace
          if (!detectedWorkspaceId) {
            const { data: memberships } = await supabase
              .from('workspace_memberships')
              .select('workspace_id')
              .eq('user_id', user.id)
              .limit(1);
              
            if (memberships && memberships.length > 0) {
              detectedWorkspaceId = memberships[0].workspace_id;
            }
          }
          
          if (detectedWorkspaceId && detectedWorkspaceId !== currentWorkspace) {
            setWorkspace(detectedWorkspaceId, user.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize notification context:', error);
      }
    };

    initializeContext();
  }, [workspace_id, user_id, currentWorkspace, setWorkspace, pathname]);

  // Filter notifications by channel for rendering
  const toastNotifications = notifications.filter(n => 
    n.channels.includes('toast') && 
    n.status === 'unread' &&
    n.persistence.auto_dismiss !== false // Don't show persistent notifications as toasts
  );

  const persistentNotifications = notifications.filter(n => 
    n.channels.includes('persistent') && 
    n.status !== 'dismissed'
  );

  const badgeCount = getBadgeCount('badge');
  const drawerCount = getBadgeCount('drawer');

  if (!currentWorkspace) {
    return null; // Don't render without workspace context
  }

  return (
    <>
      {/* Toast Notifications */}
      <div className={`fixed z-50 pointer-events-none ${
        governance?.ui_preferences?.position === 'top-left' ? 'top-4 left-4' :
        governance?.ui_preferences?.position === 'bottom-right' ? 'bottom-4 right-4' :
        governance?.ui_preferences?.position === 'bottom-left' ? 'bottom-4 left-4' :
        'top-4 right-4' // default top-right
      }`}>
        <div className="space-y-2 pointer-events-auto">
          {toastNotifications
            .slice(0, governance?.ui_preferences?.max_visible || 5)
            .map(notification => (
              <NotificationToast
                key={notification.id}
                notification={notification}
                onDismiss={() => dismissNotification(notification.id)}
                onRead={() => markAsRead(notification.id)}
              />
            ))}
        </div>
      </div>

      {/* Badge Indicator */}
      {badgeCount > 0 && (
        <NotificationBadge
          count={badgeCount}
          onClick={() => setDrawerOpen(true)}
          className={className}
        />
      )}

      {/* Persistent Notifications */}
      {persistentNotifications.length > 0 && (
        <PersistentNotifications
          notifications={persistentNotifications}
          onDismiss={dismissNotification}
          onRead={markAsRead}
          onAcknowledge={acknowledgeNotification}
        />
      )}

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onDismiss={dismissNotification}
        onRead={markAsRead}
        onAcknowledge={acknowledgeNotification}
        governance={governance}
        connectionStatus={connection_status}
      />

      {/* Development indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 left-2 text-xs text-gray-400 bg-black/10 px-2 py-1 rounded">
          Notifications: {notifications.length} | Status: {connection_status}
        </div>
      )}
    </>
  );
}

/**
 * Hook for components that need notification context
 */
export function useNotifications() {
  const store = useNotificationStore();
  
  return {
    // State
    notifications: store.notifications,
    unreadCount: store.getUnreadCount(),
    connectionStatus: store.connection_status,
    
    // Actions
    dismiss: store.dismissNotification,
    markRead: store.markAsRead,
    acknowledge: store.acknowledgeNotification,
    clearAll: store.clearAll,
    
    // Queries
    getByCategory: store.getNotificationsByCategory,
    getBadgeCount: store.getBadgeCount,
    
    // Governance
    governance: store.governance,
    updateGovernance: store.updateGovernance
  };
}