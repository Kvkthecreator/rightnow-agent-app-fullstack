"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";

/**
 * Clean Knowledge Timeline Component
 * 
 * Canon v3.0: Knowledge evolution story (artifact-like)
 * Shows user-meaningful milestones in their knowledge journey
 * Simple, focused, story-driven experience
 */

interface KnowledgeEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  significance: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
  relatedIds: Record<string, any>;
  timestamp: string;
  icon: string;
  color: string;
}

interface KnowledgeTimelineProps {
  basketId: string;
  className?: string;
  significance?: 'low' | 'medium' | 'high';
  limit?: number;
}

export default function KnowledgeTimeline({ 
  basketId, 
  className = "", 
  significance,
  limit = 50 
}: KnowledgeTimelineProps) {
  const [events, setEvents] = useState<KnowledgeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [basketId, significance, limit]);

  async function loadTimeline() {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`/api/baskets/${basketId}/knowledge-timeline`, window.location.origin);
      if (significance) {
        url.searchParams.set('significance', significance);
      }
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load knowledge timeline");
      }
      
      const data = await response.json();
      setEvents(data.timeline || []);
      
    } catch (err) {
      console.error('Knowledge timeline error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-2">Failed to load your knowledge timeline</div>
        <button 
          onClick={loadTimeline}
          className="text-blue-600 hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 text-6xl mb-4">🌱</div>
        <div className="text-gray-600 text-lg mb-2">Your knowledge journey starts here</div>
        <div className="text-gray-500 text-sm">
          Add some memory to begin building your knowledge base
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Knowledge Journey</h2>
        <div className="text-sm text-gray-500">
          {events.length} milestone{events.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Timeline Events */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Event Icon */}
              <div className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-lg
                ${getSignificanceBackground(event.significance)}
              `}>
                {event.icon}
              </div>
              
              {/* Event Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${event.color} leading-snug`}>
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                    {formatTimestamp(event.timestamp)}
                  </div>
                </div>
                
                {/* Related Entities (if any) */}
                {Object.keys(event.relatedIds).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(event.relatedIds).map(([key, value]) => (
                      <span 
                        key={key}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {key}: {typeof value === 'string' ? value.slice(0, 8) : String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Load More (if needed) */}
      {events.length >= limit && (
        <div className="text-center pt-4">
          <button 
            onClick={() => {/* Implement pagination if needed */}}
            className="text-blue-600 hover:underline text-sm"
          >
            View earlier milestones
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getSignificanceBackground(significance: string): string {
  const backgrounds: Record<string, string> = {
    'low': 'bg-gray-100',
    'medium': 'bg-blue-100',
    'high': 'bg-green-100'
  };
  return backgrounds[significance] || 'bg-gray-100';
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}