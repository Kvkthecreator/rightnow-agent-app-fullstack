'use client';

import { useNotificationStore } from '@/lib/notifications';
import { CheckCircle, Clock, XCircle, Info, AlertTriangle, Loader2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const SEVERITY_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const SEVERITY_COLORS = {
  info: 'text-blue-600',
  success: 'text-green-600', 
  warning: 'text-yellow-600',
  error: 'text-red-600'
};

const PHASE_COLORS = {
  started: 'text-blue-600',
  progress: 'text-blue-600',
  succeeded: 'text-green-600',
  failed: 'text-red-600'
};

export function NotificationCenter() {
  const { eventHistory } = useNotificationStore();
  
  // Sort by most recent first and limit to last 20
  const recentEvents = eventHistory
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  if (recentEvents.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="divide-y divide-gray-100">
        {recentEvents.map((event, index) => {
          const isJobEvent = event.type === 'job_update';
          const isActive = isJobEvent && (event.phase === 'started' || event.phase === 'progress');
          
          const Icon = isJobEvent && event.phase 
            ? (isActive ? Loader2 : SEVERITY_ICONS[event.severity])
            : SEVERITY_ICONS[event.severity];
            
          const iconColor = isJobEvent && event.phase
            ? PHASE_COLORS[event.phase]
            : SEVERITY_COLORS[event.severity];

          return (
            <div key={`${event.id}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <Icon 
                    className={cn(
                      'h-5 w-5',
                      iconColor,
                      isActive && 'animate-spin'
                    )} 
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.message}
                      </p>
                      
                      {/* Event Details */}
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{event.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{event.name}</span>
                          {event.phase && (
                            <>
                              <span>•</span>
                              <span className={cn('font-medium', PHASE_COLORS[event.phase])}>
                                {event.phase}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {/* Payload Info */}
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <div className="text-xs text-gray-400">
                            {event.payload.job_id && (
                              <span>Job: {event.payload.job_id.slice(0, 8)}...</span>
                            )}
                            {event.payload.document_id && (
                              <span>Doc: {event.payload.document_id.slice(0, 8)}...</span>
                            )}
                            {event.payload.dump_id && (
                              <span>Dump: {event.payload.dump_id.slice(0, 8)}...</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <button className="text-sm text-gray-600 hover:text-gray-900">
          View All Activity
        </button>
      </div>
    </div>
  );
}