"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Users, Edit3, Bell } from 'lucide-react';
// import type { WebSocketPayload } from '@/lib/services/UniversalChangeService'; // DISABLED - Using Supabase Realtime

export interface RealTimeNotification {
  id: string;
  type: 'change_applied' | 'change_failed' | 'conflict_detected' | 'user_joined' | 'user_left' | 'user_editing';
  title: string;
  message: string;
  timestamp: string;
  autoHide?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface RealTimeNotificationsProps {
  className?: string;
  maxNotifications?: number;
  autoHideDelay?: number;
}

/**
 * Real-time Notification System
 * 
 * Displays live notifications for:
 * - Successful changes from any user
 * - Failed changes with error details
 * - Conflict detection and resolution prompts
 * - User presence (joined/left/editing)
 * - System status updates
 */
export function RealTimeNotifications({
  className = '',
  maxNotifications = 5,
  autoHideDelay = 5000
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);

  // Listen for custom notification events (e.g., from composition status)
  useEffect(() => {
    const handleCustomNotification = (event: CustomEvent) => {
      const detail = event.detail;
      addNotification({
        type: detail.type,
        title: detail.title,
        message: detail.message,
        timestamp: detail.timestamp,
        autoHide: detail.autoHide,
        action: detail.action
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('yarnnn-notification', handleCustomNotification as EventListener);
      return () => {
        window.removeEventListener('yarnnn-notification', handleCustomNotification as EventListener);
      };
    }
  }, []);

  // Add notification
  const addNotification = (notification: Omit<RealTimeNotification, 'id'>) => {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: crypto.randomUUID()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-hide notification
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDelay);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Process WebSocket payload into notification - DISABLED for Supabase Realtime
  const processWebSocketEvent = (payload: any) => {
    switch (payload.event) {
      case 'change_applied':
        addNotification({
          type: 'change_applied',
          title: 'Change Applied',
          message: `${getChangeTypeLabel(payload.data.type)} updated successfully`,
          timestamp: payload.timestamp,
          autoHide: true
        });
        break;

      case 'change_failed':
        addNotification({
          type: 'change_failed',
          title: 'Change Failed',
          message: payload.data.errors?.[0] || 'Change could not be applied',
          timestamp: payload.timestamp,
          autoHide: false
        });
        break;

      case 'conflict_detected':
        addNotification({
          type: 'conflict_detected',
          title: 'Conflict Detected',
          message: 'Multiple users are editing the same content',
          timestamp: payload.timestamp,
          autoHide: false,
          action: {
            label: 'Resolve',
            onClick: () => {
              // This would open conflict resolution UI
              console.log('Opening conflict resolution for:', payload);
            }
          }
        });
        break;

      case 'user_joined':
        addNotification({
          type: 'user_joined',
          title: 'User Joined',
          message: `${payload.data.userEmail || 'Someone'} joined the workspace`,
          timestamp: payload.timestamp,
          autoHide: true
        });
        break;

      case 'user_left':
        addNotification({
          type: 'user_left',
          title: 'User Left',
          message: `${payload.data.userEmail || 'Someone'} left the workspace`,
          timestamp: payload.timestamp,
          autoHide: true
        });
        break;

      case 'user_editing':
        if (payload.data.isEditing) {
          addNotification({
            type: 'user_editing',
            title: 'Collaborative Editing',
            message: `${payload.data.userEmail || 'Someone'} is editing ${payload.data.isEditing}`,
            timestamp: payload.timestamp,
            autoHide: true
          });
        }
        break;
    }
  };

  // Expose the event processor for external use
  useEffect(() => {
    // Store reference for external access
    (window as any).__realTimeNotifications = { processWebSocketEvent };
    
    return () => {
      delete (window as any).__realTimeNotifications;
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual notification card
 */
function NotificationCard({
  notification,
  onClose
}: {
  notification: RealTimeNotification;
  onClose: () => void;
}) {
  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'change_applied':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'change_failed':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'conflict_detected':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'user_joined':
      case 'user_left':
        return {
          icon: Users,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'user_editing':
        return {
          icon: Edit3,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          icon: Bell,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const style = getNotificationStyle();
  const Icon = style.icon;

  return (
    <div 
      className={`
        min-w-[320px] max-w-[400px] p-4 rounded-lg border shadow-lg
        ${style.bgColor} ${style.borderColor}
        animate-in slide-in-from-right-full duration-300
      `}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${style.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss"
            >
              <XCircle size={16} />
            </button>
          </div>
          
          <p className="text-sm text-gray-700 mt-1 break-words">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-500 mt-2">
            {formatTimestamp(notification.timestamp)}
          </p>
          
          {notification.action && (
            <button
              onClick={() => {
                notification.action!.onClick();
                onClose();
              }}
              className={`
                mt-3 px-3 py-1 text-xs font-medium rounded
                ${style.iconColor.replace('text-', 'text-')} 
                ${style.bgColor.replace('50', '100')}
                hover:${style.bgColor.replace('50', '200')}
                transition-colors
              `}
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to get human-readable change type labels
 */
function getChangeTypeLabel(changeType: string): string {
  switch (changeType) {
    case 'basket_update': return 'Basket';
    case 'document_create': return 'Document';
    case 'document_update': return 'Document';
    case 'intelligence_approve': return 'Intelligence';
    case 'intelligence_generate': return 'Intelligence';
    case 'context_add': return 'Context';
    default: return 'Content';
  }
}

/**
 * Helper function to format timestamps
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

/**
 * Hook to add notifications from anywhere in the app
 */
export function useRealTimeNotifications() {
  const addNotification = (notification: Omit<RealTimeNotification, 'id'>) => {
    const notificationSystem = (window as any).__realTimeNotifications;
    if (notificationSystem) {
      // Convert to payload format for consistency
      const payload: any = {
        event: notification.type,
        basketId: 'system',
        data: {
          title: notification.title,
          message: notification.message
        },
        timestamp: notification.timestamp
      };
      notificationSystem.processWebSocketEvent(payload);
    }
  };

  return { addNotification };
}