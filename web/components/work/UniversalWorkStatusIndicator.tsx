"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { BasketNotificationsDrawer } from "@/components/work/BasketNotificationsDrawer";
import { useBasketNotifications } from "@/lib/hooks/useBasketNotifications";

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
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const basketId = React.useMemo(() => {
    if (!pathname) return undefined;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'baskets' && parts[1]) return parts[1];
    return undefined;
  }, [pathname]);

  const { unseenCount, activeWork } = useBasketNotifications(basketId);
  const activeCount = activeWork.length;

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
          {activeCount > 0 ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )}
          
          {/* Active Work Badge */}
          {activeCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {activeCount > 99 ? '99+' : activeCount}
            </Badge>
          )}
          
          {/* Connection Status Dot */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900",
            activeCount > 0 ? "bg-green-500" : "bg-gray-400"
          )} />
        </div>
      </button>

      {isExpanded && (
        <BasketNotificationsDrawer 
          basketId={basketId}
          open={isExpanded}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default UniversalWorkStatusIndicator;
