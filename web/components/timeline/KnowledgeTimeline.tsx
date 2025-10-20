"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";

/**
 * Canon-Compliant Knowledge Timeline Component
 * 
 * Sacred Principle: "Narrative is Deliberate" - Shows user's knowledge evolution story
 * Focus on meaningful milestones in knowledge development, not technical processing
 * Transforms timeline_events into user-friendly knowledge journey narrative
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
  sourceHost?: string | null;
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
      
      // Use the working timeline endpoint instead of non-existent knowledge-timeline
      const url = new URL(`/api/baskets/${basketId}/timeline`, window.location.origin);
      url.searchParams.set('limit', limit.toString());
      
      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load timeline");
      }
      
      const data = await response.json();
      // Transform timeline_events data to Canon-compliant knowledge narrative
      const transformedEvents = (data.items || []).map((item: any) => {
        const normalizedType = normalizeEventType(item.type, item.summary);
        const significanceLevel = inferSignificance(normalizedType);

        return {
          id: item.ref_id || `event_${Math.random()}`,
          type: normalizedType,
          title: createNarrativeTitle(normalizedType, item.summary, item.payload),
          description: createNarrativeDescription(normalizedType, item.payload, item.summary),
          significance: significanceLevel,
          metadata: item.payload || {},
          relatedIds: { ref_id: item.ref_id },
          timestamp: item.ts,
          icon: getEventIcon(normalizedType),
          color: getEventColor(significanceLevel),
          sourceHost: item.source_host || item.payload?.source_host || null,
        } as KnowledgeEvent;
      });
      
      // Apply significance filter on frontend since API doesn't support it
      const filteredEvents = significance 
        ? transformedEvents.filter((event: any) => event.significance === significance)
        : transformedEvents;
      
      setEvents(filteredEvents);
      
    } catch (err) {
      console.error('Timeline error:', err);
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
      <div className={`text-center py-12 max-w-md mx-auto ${className}`}>
        <div className="text-gray-400 text-6xl mb-6">🌱</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Knowledge Journey Starts Here</h3>
        <p className="text-gray-600 mb-6">
          Your timeline will track the evolution of your understanding as you add memories 
          and build knowledge connections following Canon principles.
        </p>
        
        <div className="text-left space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              📝
            </div>
            <div>
              <div className="font-medium">Add Memory</div>
              <div className="text-gray-500">Capture content to begin your knowledge base</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              🧱
            </div>
            <div>
              <div className="font-medium">Knowledge Extraction</div>
              <div className="text-gray-500">AI agents structure your content into knowledge blocks</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              🔗
            </div>
            <div>
              <div className="font-medium">Discover Connections</div>
              <div className="text-gray-500">See relationships emerge between your ideas</div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.href = `/baskets/${basketId}/add-memory`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Add Your First Memory
        </button>
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
                  <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-1 text-xs text-gray-400">
                    {event.sourceHost && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600 font-medium uppercase tracking-wide">
                        {event.sourceHost}
                      </span>
                    )}
                    <span>{formatTimestamp(event.timestamp)}</span>
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

// Helper functions for transforming timeline_events data into Canon-compliant narrative
function normalizeEventType(kind: string, summary?: string | null): string {
  const canonical = kind?.toLowerCase() || '';

  if (canonical.includes('proposal') && canonical.includes('created')) return 'governance.proposal_created';
  if (canonical.includes('proposal') && canonical.includes('approved')) return 'governance.proposal_executed';
  if (canonical.includes('proposal') && canonical.includes('rejected')) return 'governance.proposal_rejected';
  if (canonical.includes('substrate') && canonical.includes('creation')) return 'substrate.creation_completed';
  if (canonical.includes('substrate') && canonical.includes('relationship')) return 'substrate.relationships_mapped';
  if (canonical.includes('document') && canonical.includes('composed')) return 'document.composed';
  if (canonical.includes('work') && canonical.includes('started')) return 'work.initiated';
  if (canonical.includes('work') && canonical.includes('completed')) return 'work.completed';
  if (canonical.includes('capture')) return 'memory.captured';

  // Fall back to summary keywords (legacy events like P1_SUBSTRATE → P2_GRAPH)
  const summaryText = summary || '';
  if (summaryText.includes('P0_CAPTURE')) return 'memory.captured';
  if (summaryText.includes('P1_SUBSTRATE')) return 'substrate.creation_completed';
  if (summaryText.includes('P2_GRAPH')) return 'substrate.relationships_mapped';
  if (summaryText.includes('P3_REFLECTION')) return 'document.insight_regenerated';
  if (summaryText.includes('P4_COMPOSE')) return 'document.composed';

  return kind;
}

function createNarrativeTitle(eventType: string, summary: string, payload: any): string {
  // Create user-friendly titles that focus on knowledge evolution, not technical details
  const narrativeTitles: Record<string, string> = {
    'memory.captured': 'New memory added to your knowledge base',
    'substrate.creation_completed': 'Knowledge extracted and structured',
    'substrate.relationships_mapped': 'Connections discovered between your ideas',
    'document.composed': 'Document created from your knowledge',
    'document.insight_regenerated': 'Insights refreshed from updated knowledge',
    'governance.proposal_executed': 'Knowledge changes approved and applied',
    'governance.proposal_created': 'Changes proposed for review',
    'work.initiated': 'Knowledge processing started',
    'work.completed': 'Knowledge processing completed'
  };
  
  const baseTitle = narrativeTitles[eventType];
  if (baseTitle) return baseTitle;
  
  // Fallback to summary or clean up event type
  if (summary && summary !== eventType) return summary;
  return eventType.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function createNarrativeDescription(eventType: string, payload: any, summary?: string): string | undefined {
  if (!payload) return undefined;
  
  // Create narrative descriptions based on event type and payload content
  if (eventType === 'memory.captured' && payload.source_type) {
    return `Added ${payload.source_type} content to your knowledge collection`;
  }
  
  if (eventType === 'substrate.creation_completed') {
    const blockCount = payload.substrate_created?.blocks || 0;
    const contextCount = payload.substrate_created?.context_items || 0;
    if (blockCount || contextCount) {
      const parts = [];
      if (blockCount) parts.push(`${blockCount} knowledge block${blockCount === 1 ? '' : 's'}`);
      if (contextCount) parts.push(`${contextCount} meaning${contextCount === 1 ? '' : 's'}`);
      return `Created ${parts.join(' and ')} from your memory`;
    }
  }
  
  if (eventType === 'substrate.relationships_mapped' && payload.relationships_mapped) {
    return `Discovered ${payload.relationships_mapped} new connection${payload.relationships_mapped === 1 ? '' : 's'} between your knowledge`;
  }
  
  if (eventType === 'document.composed' && payload.document_title) {
    return `Composed "${payload.document_title}" using your structured knowledge`;
  }

  if (eventType === 'document.insight_regenerated' && payload.document_title) {
    return `Refreshed insight for “${payload.document_title}” to reflect the latest knowledge state.`;
  }
  
  // Fallback to existing description extraction
  if (payload.impact_summary) return payload.impact_summary;
  if (payload.ops_summary) return payload.ops_summary;
  if (payload.message) return payload.message;
  if (payload.description) return payload.description;
  if (summary) return summary;
  
  return undefined;
}

function inferSignificance(eventType: string): 'low' | 'medium' | 'high' {
  // Map timeline event types to significance levels
  const significanceMap: Record<string, 'low' | 'medium' | 'high'> = {
    // High significance - major knowledge milestones
    'substrate.creation_completed': 'high',
    'governance.proposal_executed': 'high', 
    'document.composed': 'high',
    'memory.captured': 'high',
    'document.insight_regenerated': 'medium',
    
    // Medium significance - processing and connections
    'substrate.relationships_mapped': 'medium',
    'governance.proposal_created': 'medium',
    'governance.proposal_rejected': 'medium',
    'work.initiated': 'medium',
    'work.completed': 'medium',
    
    // Low significance - routine operations
    'work.processing': 'low',
    'system.notification': 'low'
  };
  
  return significanceMap[eventType] || 'medium';
}

function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    // Canon substrate operations
    'memory.captured': '📝',
    'substrate.creation_completed': '🧱', 
    'substrate.relationships_mapped': '🔗',
    'document.composed': '📄',
    
    // Governance operations
    'governance.proposal_created': '📋',
    'governance.proposal_executed': '✅',
    'governance.proposal_rejected': '❌',
    'document.insight_regenerated': '💡',
    
    // Work operations
    'work.initiated': '🚀',
    'work.completed': '✅',
    'work.failed': '⚠️',
    
    // Default
    'default': '📌'
  };
  
  return icons[eventType] || icons['default'];
}

function getEventColor(significance: string): string {
  const colors: Record<string, string> = {
    'low': 'text-gray-600',
    'medium': 'text-blue-600', 
    'high': 'text-green-600'
  };
  return colors[significance] || 'text-gray-600';
}

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
