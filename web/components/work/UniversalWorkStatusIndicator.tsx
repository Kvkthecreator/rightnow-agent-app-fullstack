"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { useWorkQueueRealtime } from "@/hooks/useWorkStatusRealtime";
import { useWorkspace } from "@/lib/hooks/useWorkspace";

interface WorkActivity {
  work_id: string;
  work_type: string;
  status: string;
  timestamp: string;
}

/**
 * Universal Work Status Indicator - Top Bar Component
 * 
 * Shows a notification-style indicator for all work activity in current workspace.
 * Displays active work count and provides quick access to recent activity.
 * 
 * Features:
 * - Real-time work queue monitoring
 * - Notification badge with active work count
 * - Expandable activity feed
 * - Status color coding
 * - Connection status indicator
 */
export function UniversalWorkStatusIndicator() {
  const { workspace } = useWorkspace();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    queueStats,
    recentActivity,
    connectionStatus,
    isConnected
  } = useWorkQueueRealtime(workspace?.id || '');

  // Calculate total active work
  const activeWork = queueStats 
    ? (queueStats.pending || 0) + (queueStats.processing || 0) + (queueStats.cascading || 0)
    : 0;

  // Get status color for activity items
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
      case 'cascading':
        return 'text-blue-600';
      case 'claimed':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  // Format work type for display
  const formatWorkType = (workType: string): string => {
    return workType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isExpanded && !target.closest('[data-work-indicator]')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  if (!workspace?.id) return null;

  return (
    <div className="relative" data-work-indicator>
      {/* Work Status Icon/Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          isExpanded && "bg-slate-100 dark:bg-slate-800"
        )}
        title="Work Activity"
      >
        {/* Work Icon */}
        <div className="relative">
          {activeWork > 0 ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )}
          
          {/* Active Work Badge */}
          {activeWork > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {activeWork > 99 ? '99+' : activeWork}
            </Badge>
          )}
          
          {/* Connection Status Dot */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900",
            isConnected ? "bg-green-500" : "bg-gray-400"
          )} />
        </div>
      </button>

      {/* Expanded Activity Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <Card className="w-80 shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Work Activity</CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-gray-400"
                  )} />
                  {isConnected ? "Live" : "Offline"}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Queue Statistics */}
              {queueStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {queueStats.pending || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {(queueStats.processing || 0) + (queueStats.cascading || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      {queueStats.completed || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Recent Activity
                </h4>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={`${activity.work_id}-${index}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            activity.status === 'completed' && "bg-green-500",
                            activity.status === 'failed' && "bg-red-500",
                            ['processing', 'cascading'].includes(activity.status) && "bg-blue-500",
                            activity.status === 'claimed' && "bg-yellow-500",
                            activity.status === 'pending' && "bg-gray-400"
                          )} />
                          <span className="truncate font-medium">
                            {formatWorkType(activity.work_type)}
                          </span>
                          <Badge 
                            variant={
                              activity.status === 'completed' ? 'success' :
                              activity.status === 'failed' ? 'destructive' :
                              'secondary'
                            } 
                            className="text-xs px-1.5 py-0"
                          >
                            {activity.status.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground flex-shrink-0 ml-2">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div className="text-xs">No recent activity</div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-3 flex gap-2">
                <button
                  onClick={() => window.open('/work', '_blank')}
                  className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-md transition-colors"
                >
                  View Queue
                </button>
                <button
                  onClick={() => window.open('/queue', '_blank')}
                  className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-md transition-colors"
                >
                  Monitor
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UniversalWorkStatusIndicator;