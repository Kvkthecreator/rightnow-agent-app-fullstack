/**
 * YARNNN Notification Toast Component - Canon v1.0.0 Compliant
 * 
 * Individual toast notification with auto-dismiss and interaction handling.
 * Replaces legacy Toast.tsx with unified styling and behavior.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Zap,
  FileText,
  Users,
  Settings,
  AlertCircle
} from 'lucide-react';
import { UnifiedNotification } from '@/lib/notifications/types';
import { Button } from '@/components/ui/Button';

interface NotificationToastProps {
  notification: UnifiedNotification;
  onDismiss: () => void;
  onRead: () => void;
}

export function NotificationToast({ 
  notification, 
  onDismiss, 
  onRead 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss logic
  useEffect(() => {
    if (typeof notification.persistence.auto_dismiss === 'number') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.persistence.auto_dismiss * 1000);

      return () => clearTimeout(timer);
    }
  }, [notification.persistence.auto_dismiss]);

  // Mark as read when displayed
  useEffect(() => {
    if (notification.status === 'unread') {
      const timer = setTimeout(() => {
        onRead();
      }, 1000); // Mark as read after 1 second

      return () => clearTimeout(timer);
    }
  }, [notification.status, onRead]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Allow exit animation
  };

  const getNotificationStyle = () => {
    switch (notification.severity) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
      case 'critical':
        return {
          icon: notification.severity === 'critical' ? AlertCircle : XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      default:
        return {
          icon: getCategoryIcon(notification.category),
          iconColor: getCategoryIconColor(notification.category),
          bgColor: getCategoryBgColor(notification.category),
          borderColor: getCategoryBorderColor(notification.category),
          titleColor: getCategoryTitleColor(notification.category),
          messageColor: getCategoryMessageColor(notification.category)
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
        transform transition-all duration-300 ease-in-out
        ${isExiting 
          ? 'translate-x-full opacity-0 scale-95' 
          : 'translate-x-0 opacity-100 scale-100'
        }
        ${isVisible ? 'animate-in slide-in-from-right-full' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${style.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-medium ${style.titleColor} truncate`}>
              {notification.title}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          
          <p className={`text-sm ${style.messageColor} mt-1 break-words`}>
            {notification.message}
          </p>
          
          {/* Category and timestamp */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 capitalize">
              {notification.category}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
          
          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.slice(0, 2).map(action => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant === 'primary' ? 'default' : 
                           action.variant === 'destructive' ? 'destructive' : 'outline'}
                  onClick={() => {
                    action.handler();
                    handleDismiss();
                  }}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {typeof notification.persistence.auto_dismiss === 'number' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full ${style.iconColor.replace('text-', 'bg-')} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${notification.persistence.auto_dismiss}s linear`
            }}
          />
        </div>
      )}
    </div>
  );
}

// Category-specific styling helpers
function getCategoryIcon(category: string) {
  switch (category) {
    case 'substrate': return Zap;
    case 'presentation': return FileText;
    case 'governance': return Settings;
    case 'system': return Users;
    default: return Info;
  }
}

function getCategoryIconColor(category: string) {
  switch (category) {
    case 'substrate': return 'text-purple-600';
    case 'presentation': return 'text-blue-600';
    case 'governance': return 'text-orange-600';
    case 'work': return 'text-indigo-600';
    default: return 'text-gray-600';
  }
}

function getCategoryBgColor(category: string) {
  switch (category) {
    case 'substrate': return 'bg-purple-50';
    case 'presentation': return 'bg-blue-50';
    case 'governance': return 'bg-orange-50';
    case 'work': return 'bg-indigo-50';
    default: return 'bg-gray-50';
  }
}

function getCategoryBorderColor(category: string) {
  switch (category) {
    case 'substrate': return 'border-purple-200';
    case 'presentation': return 'border-blue-200';
    case 'governance': return 'border-orange-200';
    case 'work': return 'border-indigo-200';
    default: return 'border-gray-200';
  }
}

function getCategoryTitleColor(category: string) {
  switch (category) {
    case 'substrate': return 'text-purple-800';
    case 'presentation': return 'text-blue-800';
    case 'governance': return 'text-orange-800';
    case 'work': return 'text-indigo-800';
    default: return 'text-gray-800';
  }
}

function getCategoryMessageColor(category: string) {
  switch (category) {
    case 'substrate': return 'text-purple-700';
    case 'presentation': return 'text-blue-700';
    case 'governance': return 'text-orange-700';
    case 'work': return 'text-indigo-700';
    default: return 'text-gray-700';
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  return date.toLocaleDateString();
}

// CSS for progress bar animation
const styles = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('notification-toast-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'notification-toast-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}