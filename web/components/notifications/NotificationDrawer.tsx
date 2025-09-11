/**
 * YARNNN Notification Drawer Component - Canon v1.0.0 Compliant
 * 
 * Comprehensive notification management interface with filtering,
 * search, and batch operations. Replaces specialized notification drawers.
 */

"use client";

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  RefreshCw
} from 'lucide-react';
import type { UnifiedNotification, NotificationGovernance, NotificationCategory } from '@/lib/notifications/types';
import { Button } from '@/components/ui/Button';
import { CategoryNotificationBadge } from './NotificationBadge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UnifiedNotification[];
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
  governance: NotificationGovernance | null;
  connectionStatus: string;
}

type FilterType = 'all' | 'unread' | 'persistent' | NotificationCategory;

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onRead,
  onAcknowledge,
  governance,
  connectionStatus
}: NotificationDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply category/status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'unread') {
        filtered = filtered.filter(n => n.status === 'unread');
      } else if (activeFilter === 'persistent') {
        filtered = filtered.filter(n => n.channels.includes('persistent'));
      } else {
        filtered = filtered.filter(n => n.category === activeFilter);
      }
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    // Sort by priority and timestamp
    return filtered.sort((a, b) => {
      // Priority: critical > error > warning > success > info
      const severityOrder = { critical: 0, error: 1, warning: 2, success: 3, info: 4 };
      const aSeverity = severityOrder[a.severity] ?? 5;
      const bSeverity = severityOrder[b.severity] ?? 5;
      
      if (aSeverity !== bSeverity) return aSeverity - bSeverity;
      
      // Then by read status (unread first)
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (b.status === 'unread' && a.status !== 'unread') return 1;
      
      // Finally by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [notifications, activeFilter, searchQuery]);

  // Category counts for filter buttons
  const categoryCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      persistent: notifications.filter(n => n.channels.includes('persistent')).length,
      substrate: notifications.filter(n => n.category === 'substrate').length,
      presentation: notifications.filter(n => n.category === 'presentation').length,
      work: notifications.filter(n => n.category === 'work').length,
      governance: notifications.filter(n => n.category === 'governance').length,
      system: notifications.filter(n => n.category === 'system').length,
    };
    return counts;
  }, [notifications]);

  // Batch actions
  const markAllAsRead = () => {
    filteredNotifications
      .filter(n => n.status === 'unread')
      .forEach(n => onRead(n.id));
  };

  const dismissAll = () => {
    filteredNotifications
      .filter(n => !n.persistence.requires_acknowledgment)
      .forEach(n => onDismiss(n.id));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              {connectionStatus}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'All' },
              { key: 'unread' as const, label: 'Unread' },
              { key: 'persistent' as const, label: 'Persistent' },
              { key: 'substrate' as const, label: 'Substrate' },
              { key: 'presentation' as const, label: 'Documents' },
              { key: 'work' as const, label: 'Work' },
              { key: 'governance' as const, label: 'Governance' },
              { key: 'system' as const, label: 'System' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors
                  ${activeFilter === key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {label}
                {categoryCounts[key] > 0 && (
                  <span className="ml-1 bg-white/20 px-1 rounded">
                    {categoryCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Actions */}
        {filteredNotifications.length > 0 && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                disabled={categoryCounts.unread === 0}
                className="text-xs"
              >
                <CheckCircle size={14} className="mr-1" />
                Mark All Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismissAll}
                className="text-xs"
              >
                <Trash2 size={14} className="mr-1" />
                Dismiss All
              </Button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Clock size={48} className="mb-4 opacity-30" />
              <p className="text-sm">
                {searchQuery ? 'No notifications match your search' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map(notification => (
                <NotificationDrawerItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={() => onDismiss(notification.id)}
                  onRead={() => onRead(notification.id)}
                  onAcknowledge={() => onAcknowledge(notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with settings */}
        <div className="p-4 border-t bg-gray-50">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-xs"
            onClick={() => {
              // TODO: Open notification settings
              console.log('Opening notification settings');
            }}
          >
            <Settings size={14} className="mr-2" />
            Notification Settings
          </Button>
        </div>
      </div>
    </>
  );
}

function NotificationDrawerItem({
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
  const getSeverityColor = () => {
    switch (notification.severity) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'error': return 'border-l-red-400 bg-red-50';
      case 'warning': return 'border-l-yellow-400 bg-yellow-50';
      case 'success': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-blue-400 bg-blue-50';
    }
  };

  return (
    <div
      className={`
        p-3 border-l-4 ${getSeverityColor()}
        ${notification.status === 'unread' ? 'bg-opacity-50' : 'bg-opacity-20'}
        hover:bg-opacity-70 transition-colors cursor-pointer
      `}
      onClick={() => notification.status === 'unread' && onRead()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">
              {notification.title}
            </h4>
            {notification.status === 'unread' && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoryNotificationBadge
                category={notification.category}
                count={1}
                className="text-xs"
              />
              <span className="text-xs text-gray-500">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {notification.actions && notification.actions.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                notification.actions![0].handler();
                onDismiss();
              }}
              className="text-xs h-6"
            >
              {notification.actions[0].label}
            </Button>
          )}
          
          {notification.persistence.requires_acknowledgment ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge();
              }}
              className="text-xs h-6"
            >
              Ack
            </Button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
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