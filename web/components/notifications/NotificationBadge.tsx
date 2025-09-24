'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useNotificationStore } from '@/lib/notifications';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { eventHistory } = useNotificationStore();
  
  // Count active jobs (job_update events that are started or progress, not completed)
  const activeJobs = eventHistory.filter(event => 
    event.type === 'job_update' && 
    (event.phase === 'started' || event.phase === 'progress')
  ).length;
  
  // Count recent notifications (last 24 hours)
  const recentCount = eventHistory.filter(event => {
    const eventTime = new Date(event.created_at).getTime();
    const now = Date.now();
    return (now - eventTime) < 24 * 60 * 60 * 1000; // 24 hours
  }).length;

  return (
    <div className="relative">
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        {activeJobs > 0 ? (
          // Show spinner when jobs are active
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          // Show bell when no active jobs
          <Bell className="h-5 w-5" />
        )}
        
        {/* Count Badge */}
        {recentCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
            {recentCount > 99 ? '99+' : recentCount}
          </span>
        )}
        
        {/* Active Jobs Indicator */}
        {activeJobs > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-medium rounded-full h-4 w-4 flex items-center justify-center">
            {activeJobs}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {activeJobs > 0 && (
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {activeJobs} active
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ×
                </button>
              </div>
            </div>
            
            <NotificationCenter />
          </div>
        </>
      )}
    </div>
  );
}