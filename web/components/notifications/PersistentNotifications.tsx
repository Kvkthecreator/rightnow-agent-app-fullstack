/**
 * YARNNN Persistent Notifications Component - Canon v1.0.0 Compliant
 * 
 * Always-visible notifications that require user acknowledgment.
 * Used for critical alerts, approval requirements, and document impacts.
 */

"use client";

import React from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Info
} from 'lucide-react';
import type { UnifiedNotification } from '@/lib/notifications/types';
import { Button } from '@/components/ui/Button';

interface PersistentNotificationsProps {
  notifications: UnifiedNotification[];
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
}

export function PersistentNotifications({
  notifications,
  onDismiss,
  onRead,
  onAcknowledge
}: PersistentNotificationsProps) {
  if (notifications.length === 0) return null;

  // Sort by severity and timestamp
  const sortedNotifications = [...notifications].sort((a, b) => {
    const severityOrder = { critical: 0, error: 1, warning: 2, success: 3, info: 4 };
    const aSeverity = severityOrder[a.severity] ?? 5;
    const bSeverity = severityOrder[b.severity] ?? 5;
    
    if (aSeverity !== bSeverity) return aSeverity - bSeverity;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="space-y-2">
        {sortedNotifications.slice(0, 3).map(notification => (
          <PersistentNotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            onRead={() => onRead(notification.id)}
            onAcknowledge={() => onAcknowledge(notification.id)}
          />
        ))}
        
        {sortedNotifications.length > 3 && (
          <div className="text-center">
            <Button variant="outline" size="sm" className="text-xs">
              +{sortedNotifications.length - 3} more notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PersistentNotificationCard({
  notification,
  onDismiss,
  onRead,
  onAcknowledge
}: {
  notification: UnifiedNotification;
  onDismiss: () => void;
  onRead: () => void;
  onAcknowledge: () => void;
}) {
  const getNotificationStyle = () => {
    switch (notification.severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700'
        };
    }
  };

  const style = getNotificationStyle();
  const Icon = style.icon;

  React.useEffect(() => {
    if (notification.status === 'unread') {
      const timer = setTimeout(() => {
        onRead();
      }, 2000); // Mark as read after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [notification.status, onRead]);

  return (
    <div
      className={`
        w-full p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm
        ${style.bgColor} ${style.borderColor}
        animate-in slide-in-from-top duration-300
      `}
    >
      <div className="flex items-start gap-3">
        <Icon size={24} className={`${style.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className={`font-semibold text-base ${style.titleColor}`}>
                {notification.title}
              </h3>
              <p className={`text-sm ${style.messageColor} mt-1`}>
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                <span className="capitalize">{notification.category}</span>
                <span>{formatTimestamp(notification.timestamp)}</span>
                {notification.governance_context.requires_approval && (
                  <span className="font-medium">Approval Required</span>
                )}
              </div>
            </div>
            
            <button
              onClick={onDismiss}
              className={`${style.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
              title="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {notification.actions?.map(action => (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant === 'primary' ? 'default' : 
                         action.variant === 'destructive' ? 'destructive' : 'outline'}
                onClick={() => {
                  action.handler();
                  if (notification.persistence.requires_acknowledgment) {
                    onAcknowledge();
                  } else {
                    onDismiss();
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
            
            {notification.persistence.requires_acknowledgment ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onAcknowledge}
                className="ml-auto"
              >
                Acknowledge
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="ml-auto"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress indicator for critical notifications */}
      {notification.severity === 'critical' && (
        <div className="mt-3 flex items-center gap-2 text-xs opacity-60">
          <div className="flex-1 bg-red-200 rounded-full h-1">
            <div 
              className="bg-red-500 h-1 rounded-full animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
          <span>Critical Alert</span>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}