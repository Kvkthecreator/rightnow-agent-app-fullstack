/**
 * Notification Center
 *
 * Canon: YARNNN_NOTIFICATION_CANON_V2.md
 * Purpose: Display user alerts from database (persistent notifications)
 * Domain: Cross-cutting observability (watches all domains)
 */
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';
import { CheckCircle, XCircle, Info, AlertTriangle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserAlert {
  id: string;
  workspace_id: string;
  user_id: string;
  alert_type: 'governance' | 'capture' | 'processing' | 'integration' | 'system';
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  created_at: string;
  action_href?: string;
  action_label?: string;
  related_basket_id?: string;
  related_proposal_id?: string;
  related_work_id?: string;
  read_at?: string;
  dismissed_at?: string;
}

const SEVERITY_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  critical: XCircle
};

const SEVERITY_COLORS = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
  critical: 'text-rose-600'
};

const TYPE_LABELS = {
  governance: 'Change Request',
  capture: 'Capture',
  processing: 'Processing',
  integration: 'Integration',
  system: 'System'
};

export function NotificationCenter() {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function loadAlerts() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Query user_alerts table
        const { data, error } = await supabase
          .from('user_alerts')
          .select('*')
          .eq('user_id', user.id)
          .is('dismissed_at', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Failed to load alerts:', error);
          return;
        }

        setAlerts(data || []);
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_alerts'
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleDismiss = async (alertId: string) => {
    await supabase
      .from('user_alerts')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', alertId);

    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleMarkRead = async (alertId: string) => {
    if (alerts.find(a => a.id === alertId)?.read_at) return;

    await supabase
      .from('user_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId);

    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a)
    );
  };

  // Group alerts by type
  const grouped = alerts.reduce((acc, alert) => {
    if (!acc[alert.alert_type]) acc[alert.alert_type] = [];
    acc[alert.alert_type].push(alert);
    return acc;
  }, {} as Record<string, UserAlert[]>);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-3"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No notifications</p>
        <p className="text-xs mt-1">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Governance Alerts */}
      {grouped.governance && grouped.governance.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-gray-50 font-semibold text-xs uppercase text-gray-600">
            Change Requests ({grouped.governance.length})
          </div>
          {grouped.governance.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Capture Alerts */}
      {grouped.capture && grouped.capture.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-gray-50 font-semibold text-xs uppercase text-gray-600">
            Unassigned Captures ({grouped.capture.length})
          </div>
          {grouped.capture.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Processing Alerts */}
      {grouped.processing && grouped.processing.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-gray-50 font-semibold text-xs uppercase text-gray-600">
            Processing ({grouped.processing.length})
          </div>
          {grouped.processing.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Integration Alerts */}
      {grouped.integration && grouped.integration.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-gray-50 font-semibold text-xs uppercase text-gray-600">
            Integrations ({grouped.integration.length})
          </div>
          {grouped.integration.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* System Alerts */}
      {grouped.system && grouped.system.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2 bg-gray-50 font-semibold text-xs uppercase text-gray-600">
            System ({grouped.system.length})
          </div>
          {grouped.system.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <button className="text-sm text-gray-600 hover:text-gray-900">
          View All Activity
        </button>
      </div>
    </div>
  );
}

function AlertItem({
  alert,
  onDismiss,
  onMarkRead
}: {
  alert: UserAlert;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const Icon = SEVERITY_ICONS[alert.severity];
  const iconColor = SEVERITY_COLORS[alert.severity];
  const isUnread = !alert.read_at;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(alert.id);
    }
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
        isUnread && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium text-gray-900',
                isUnread && 'font-semibold'
              )}>
                {alert.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {alert.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="capitalize">{TYPE_LABELS[alert.alert_type]}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
              </div>

              {/* Actions */}
              {alert.action_href && (
                <div className="mt-2">
                  <Link
                    href={alert.action_href}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {alert.action_label || 'View'} →
                  </Link>
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
