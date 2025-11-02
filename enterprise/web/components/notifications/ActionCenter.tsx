"use client";

import { useState, useEffect, useRef } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { Bell, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from '@/lib/notifications';

/**
 * Clean Action Center Component
 * 
 * Canon v3.0: Real-time actionable alerts (service layer)
 * Shows things requiring user attention or awareness
 * Clear action paths for each alert
 */

interface UserAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntities: Record<string, any>;
  expiresAt?: string;
  timestamp: string;
  isRead: boolean;
  icon: string;
  color: string;
}

interface AlertCounts {
  total: number;
  unread: number;
  actionable: number;
}

interface ActionCenterProps {
  className?: string;
  onlyActionable?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export default function ActionCenter({ 
  className = "",
  onlyActionable = false,
  severity 
}: ActionCenterProps) {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [counts, setCounts] = useState<AlertCounts>({ total: 0, unread: 0, actionable: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const seenAlertIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  useEffect(() => {
    loadAlerts();
    // Set up polling for real-time updates
    const interval = setInterval(loadAlerts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [onlyActionable, severity]);

  async function loadAlerts() {
    try {
      const url = new URL('/api/user/alerts', window.location.origin);
      if (onlyActionable) {
        url.searchParams.set('actionable', 'true');
      }
      if (severity) {
        url.searchParams.set('severity', severity);
      }
      
      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load alerts");
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setCounts(data.counts || { total: 0, unread: 0, actionable: 0 });
      setError(null);
      hydrateToasts(data.alerts || []);

    } catch (err) {
      console.error('Action center error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  function hydrateToasts(nextAlerts: UserAlert[]) {
    // Avoid spamming toasts on initial hydration
    const nextIds = new Set(nextAlerts.map(alert => alert.id));
    if (!hasInitialized.current) {
      seenAlertIds.current = nextIds;
      hasInitialized.current = true;
      return;
    }

    const addToast = useNotificationStore.getState().addToast;
    nextAlerts.forEach(alert => {
      if (seenAlertIds.current.has(alert.id)) {
        return;
      }

      const severity = mapAlertSeverity(alert.severity);
      addToast({
        message: `${alert.title}${alert.message ? ' — ' + alert.message : ''}`,
        severity,
        dedupe_key: `alert_${alert.id}`,
        duration: severity === 'error' ? 8000 : undefined,
      });
    });

    seenAlertIds.current = nextIds;
  }

  function mapAlertSeverity(severity: UserAlert['severity']): 'info' | 'warning' | 'error' {
    switch (severity) {
      case 'warning':
        return 'warning';
      case 'error':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  async function handleAlertAction(alertId: string, action: 'markRead' | 'dismiss') {
    try {
      const response = await fetchWithToken('/api/user/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });
      
      if (response.ok) {
        // Optimistically update UI
        if (action === 'dismiss') {
          setAlerts(prev => prev.filter(a => a.id !== alertId));
          seenAlertIds.current.delete(alertId);
          setCounts(prev => ({
            total: Math.max(prev.total - 1, 0),
            unread: Math.max(prev.unread - (alerts.find(a => a.id === alertId)?.isRead ? 0 : 1), 0),
            actionable: Math.max(prev.actionable - (alerts.find(a => a.id === alertId)?.actionable ? 1 : 0), 0)
          }));
        } else if (action === 'markRead') {
          setAlerts(prev => prev.map(a => 
            a.id === alertId ? { ...a, isRead: true } : a
          ));
          setCounts(prev => ({ ...prev, unread: Math.max(prev.unread - 1, 0) }));
        }
      }
    } catch (err) {
      console.error('Alert action error:', err);
    }
  }

  const badgeCount = counts.actionable > 0 ? counts.actionable : counts.unread;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications ${badgeCount > 0 ? `(${badgeCount})` : ''}`}
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* Alerts Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Action Center
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <div className="text-red-600 mb-2">Failed to load alerts</div>
                  <button 
                    onClick={loadAlerts}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-2">✨</div>
                  <div className="text-gray-600">All caught up!</div>
                  <div className="text-gray-500 text-sm">No alerts need your attention</div>
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !alert.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Alert Icon */}
                        <div className={`flex-shrink-0 text-lg ${alert.color}`}>
                          {alert.icon}
                        </div>
                        
                        {/* Alert Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 text-sm leading-snug">
                              {alert.title}
                            </h4>
                            <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {formatTimestamp(alert.timestamp)}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            {alert.actionable && alert.actionUrl && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  window.location.href = alert.actionUrl!;
                                  setIsOpen(false);
                                }}
                                className="text-xs"
                              >
                                {alert.actionLabel || 'Take Action'}
                                <ArrowRight size={12} className="ml-1" />
                              </Button>
                            )}
                            
                            {!alert.isRead && (
                              <button
                                onClick={() => handleAlertAction(alert.id, 'markRead')}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Check size={12} />
                                Mark Read
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleAlertAction(alert.id, 'dismiss')}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="border-t p-3 text-center">
                <button
                  onClick={() => {
                    // Mark all as read
                    alerts.filter(a => !a.isRead).forEach(alert => 
                      handleAlertAction(alert.id, 'markRead')
                    );
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return date.toLocaleDateString();
  }
}
