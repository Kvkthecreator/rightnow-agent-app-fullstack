/**
 * Consumer Timeline Component - Canon v1.4.0 Adapter Pattern
 * 
 * PURE PRESENTATION LAYER using Consumer Memory Adapter
 * - All data comes from adapter transformation of canonical agent data
 * - No client-side intelligence generation
 * - Consumer-optimized UX for personal memory timeline
 * - Workspace-scoped via adapter
 */

'use client';

import { useEffect, useState } from 'react';
import { useConsumerAdapter } from '@/lib/adapters/hooks/useConsumerAdapter';
import type { ConsumerEvent } from '@/lib/adapters/ConsumerMemoryAdapter';

interface ConsumerTimelineProps {
  basketId: string;
  className?: string;
  onEventClick?: (event: ConsumerEvent) => void;
}

/**
 * Consumer-optimized timeline view
 * Canon Compliance: Pure presentation of adapter-transformed canonical data
 */
export function ConsumerTimeline({ 
  basketId, 
  className = '',
  onEventClick 
}: ConsumerTimelineProps) {
  const { 
    timeline, 
    loading, 
    error, 
    loadTimeline, 
    clearError,
    isReady 
  } = useConsumerAdapter(basketId);

  const [refreshing, setRefreshing] = useState(false);

  // Load timeline on mount and when basketId changes
  useEffect(() => {
    if (isReady && basketId) {
      loadTimeline(basketId);
    }
  }, [isReady, basketId, loadTimeline]);

  // Refresh timeline manually
  const handleRefresh = async () => {
    if (!isReady) return;
    
    setRefreshing(true);
    try {
      await loadTimeline(basketId);
    } finally {
      setRefreshing(false);
    }
  };

  // Consumer-friendly loading state
  if (loading && timeline.length === 0) {
    return (
      <div className={`consumer-timeline-loading ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-600">Loading your memory timeline...</p>
        </div>
      </div>
    );
  }

  // Consumer-friendly error state
  if (error) {
    return (
      <div className={`consumer-timeline-error ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-red-500 text-xl">⚠️</div>
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={clearError}
            className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Consumer-friendly empty state
  if (timeline.length === 0) {
    return (
      <div className={`consumer-timeline-empty ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-gray-400 text-4xl">📝</div>
          <p className="text-sm text-gray-600">Your memory timeline will appear here</p>
          <p className="text-xs text-gray-500">
            Start by capturing thoughts, and watch AI agents create your personal knowledge graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`consumer-timeline ${className}`}>
      {/* Consumer Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Memory Timeline</h2>
          <p className="text-sm text-gray-600">
            {timeline.length} events • AI agents processing your thoughts
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Consumer Timeline Events - Agent Processing Showcase */}
      <div className="space-y-3">
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1;
          
          return (
            <div 
              key={event.id}
              className={`consumer-timeline-event ${onEventClick ? 'cursor-pointer hover:bg-gray-50' : ''} 
                         relative flex items-start space-x-3 p-3 rounded-lg border border-gray-100`}
              onClick={() => onEventClick?.(event)}
            >
              {/* Timeline Connector Line */}
              {!isLast && (
                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
              )}

              {/* Consumer Event Icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm bg-blue-100 rounded-full">
                {event.icon}
              </div>

              {/* Consumer Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Canon Compliant: Agent-computed title */}
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    
                    {/* Agent Attribution - Consumer-friendly */}
                    {event.agentAttribution && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          AI {event.agentAttribution}
                        </span>
                        {event.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(event.confidence * 100)}% confident
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Consumer Category Badge */}
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full
                      ${event.category === 'capture' ? 'bg-green-50 text-green-700' :
                        event.category === 'insight' ? 'bg-purple-50 text-purple-700' :
                        event.category === 'connection' ? 'bg-cyan-50 text-cyan-700' :
                        'bg-gray-50 text-gray-700'}`}>
                      {event.category}
                    </span>
                  </div>
                  
                  {/* Agent-computed relative time */}
                  <span className="text-xs text-gray-500 ml-4">
                    {event.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consumer AI Processing Indicator */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              🤖
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              AI Agents at Work
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Your thoughts are being continuously analyzed by specialized AI agents to create insights, 
              find connections, and help you understand patterns in your thinking.
            </p>
          </div>
        </div>
      </div>

      {/* Consumer Pagination (if needed) */}
      {timeline.length >= 50 && (
        <div className="mt-6 flex justify-center">
          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Load More Events
          </button>
        </div>
      )}
    </div>
  );
}