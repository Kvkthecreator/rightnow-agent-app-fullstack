"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import type { TimelineEventDTO } from "@/shared/contracts/timeline";

let dayjsRef: any;

interface UnifiedTimelineProps {
  basketId: string;
  className?: string;
  onEventClick?: (event: TimelineEventDTO) => void;
  pipelineFilter?: string;
}

interface TimelineResponse {
  events: TimelineEventDTO[];
  has_more: boolean;
  next_cursor?: string;
  last_cursor?: string;
}

// Event type icons and labels - Enhanced for Canon v1.4.0 Agent Processing
const EVENT_CONFIG = {
  // P0 Capture Events
  "dump.created": {
    icon: "📄",
    label: "Memory captured",
    color: "text-blue-600",
    pipeline: "P0_CAPTURE",
  },
  "dump.queued": {
    icon: "⏳",
    label: "Processing queued",
    color: "text-blue-500",
    pipeline: "P0_CAPTURE",
  },
  
  // P1 Substrate Events
  "block.created": {
    icon: "🧱",
    label: "Block created",
    color: "text-orange-600",
    pipeline: "P1_SUBSTRATE",
  },
  "block.updated": {
    icon: "🔧",
    label: "Block updated",
    color: "text-orange-500",
    pipeline: "P1_SUBSTRATE",
  },
  "block.state_changed": {
    icon: "🔄",
    label: "Block status changed",
    color: "text-orange-400",
    pipeline: "P1_SUBSTRATE",
  },
  "context_item.created": {
    icon: "🏷️",
    label: "Context tagged",
    color: "text-emerald-600",
    pipeline: "P1_SUBSTRATE",
  },
  "context_item.updated": {
    icon: "✏️",
    label: "Context updated",
    color: "text-emerald-500",
    pipeline: "P1_SUBSTRATE",
  },

  // P2 Graph Events
  "relationship.created": {
    icon: "🔗",
    label: "Connection found",
    color: "text-cyan-600",
    pipeline: "P2_GRAPH",
  },
  "relationship.deleted": {
    icon: "💔",
    label: "Connection removed",
    color: "text-cyan-400",
    pipeline: "P2_GRAPH",
  },

  // P3 Reflection Events
  "reflection.computed": {
    icon: "🤔",
    label: "Insights generated",
    color: "text-purple-600",
    pipeline: "P3_REFLECTION",
  },
  "reflection.cached": {
    icon: "💭",
    label: "Insights cached",
    color: "text-purple-500",
    pipeline: "P3_REFLECTION",
  },

  // P4 Presentation Events (deliberate)
  "document.created": {
    icon: "📝",
    label: "Document created",
    color: "text-indigo-600",
    pipeline: "P4_PRESENTATION",
  },
  "document.updated": {
    icon: "✏️",
    label: "Document updated",
    color: "text-indigo-500",
    pipeline: "P4_PRESENTATION",
  },
  "document.composed": {
    icon: "📋",
    label: "Document composed",
    color: "text-indigo-700",
    pipeline: "P4_PRESENTATION",
  },
  "narrative.authored": {
    icon: "✍️",
    label: "Narrative authored",
    color: "text-violet-600",
    pipeline: "P4_PRESENTATION",
  },

  // Queue Processing Events
  "queue.entry_created": {
    icon: "📥",
    label: "Queued for processing",
    color: "text-slate-600",
    pipeline: "QUEUE",
  },
  "queue.processing_started": {
    icon: "⚡",
    label: "Agent processing started",
    color: "text-yellow-600",
    pipeline: "QUEUE",
  },
  "queue.processing_completed": {
    icon: "✅",
    label: "Processing complete",
    color: "text-green-600",
    pipeline: "QUEUE",
  },
  "queue.processing_failed": {
    icon: "⚠️",
    label: "Processing failed",
    color: "text-red-600",
    pipeline: "QUEUE",
  },

  // Legacy Events (backward compatibility)
  "delta.applied": {
    icon: "✨",
    label: "Change applied",
    color: "text-green-600",
  },
  "delta.rejected": {
    icon: "❌",
    label: "Change rejected",
    color: "text-red-600",
  },
  "basket.created": {
    icon: "🧺",
    label: "Basket created",
    color: "text-teal-600",
  },
  "workspace.member_added": {
    icon: "👤",
    label: "Member added",
    color: "text-gray-600",
  },
} as const;

export default function UnifiedTimeline({
  basketId,
  className = "",
  onEventClick,
  pipelineFilter = "all",
}: UnifiedTimelineProps) {
  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingStats, setProcessingStats] = useState<{
    activeProcessing: number;
    avgProcessingTime: number;
    successRate: number;
  } | null>(null);

  if (!dayjsRef) {
    // Lazy load dayjs and relativeTime plugin when component mounts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const d = require("dayjs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    d.extend(require("dayjs/plugin/relativeTime"));
    dayjsRef = d;
  }

  useEffect(() => {
    loadEvents();
  }, [basketId, pipelineFilter]);

  async function loadEvents(useCursor?: string) {
    try {
      const url = new URL(`/api/baskets/${basketId}/timeline`, window.location.origin);
      if (useCursor) {
        url.searchParams.set("cursor", useCursor);
      }
      url.searchParams.set("limit", "50");

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load timeline");
      }

      const data: any = await response.json();
      
      // Map API response format to expected TimelineEventDTO format
      const mappedItems = (data.items || []).map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        basket_id: basketId,
        event_type: item.type || item.event_type || 'unknown',
        event_data: item.payload || {},
        created_at: item.ts || item.created_at || new Date().toISOString(),
        description: item.summary || item.description,
        processing_agent: item.processing_agent,
        agent_confidence: item.agent_confidence
      }));

      if (useCursor) {
        setEvents((prev) => [...prev, ...mappedItems]);
      } else {
        setEvents(mappedItems);
      }

      setHasMore(data.has_more);
      setCursor(data.next_cursor);
      
      // Calculate processing stats from events
      if (!useCursor) {
        calculateProcessingStats(mappedItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function calculateProcessingStats(allEvents: TimelineEventDTO[]) {
    // Count active processing
    const activeProcessing = allEvents.filter(e => 
      e.event_type === "queue.processing_started" && 
      !allEvents.some(completed => 
        completed.event_type === "queue.processing_completed" && 
        completed.event_data?.queue_id === e.event_data?.queue_id
      )
    ).length;

    // Calculate success rate (last 24h)
    const last24h = dayjsRef().subtract(24, 'hour');
    const recentEvents = allEvents.filter(e => dayjsRef(e.created_at).isAfter(last24h));
    const completed = recentEvents.filter(e => e.event_type === "queue.processing_completed").length;
    const failed = recentEvents.filter(e => e.event_type === "queue.processing_failed").length;
    const total = completed + failed;
    const successRate = total > 0 ? (completed / total) * 100 : 100;

    setProcessingStats({
      activeProcessing,
      avgProcessingTime: 0, // Would need backend calculation
      successRate
    });
  }

  async function loadMore() {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    await loadEvents(cursor);
  }

  function getEventConfig(eventType: string) {
    return EVENT_CONFIG[eventType as keyof typeof EVENT_CONFIG] || {
      icon: "📌",
      label: eventType,
      color: "text-gray-500",
    };
  }

  // Canon v1.4.0: Client-side intelligence removed - descriptions come from agents
  function getEventDescription(event: TimelineEventDTO): string {
    // Use agent-computed description if available, otherwise fallback to simple event type
    if (event.description) {
      return event.description;
    }
    
    // Simple fallback without client-side intelligence
    if (!event.event_type) {
      return 'Processing event';
    }
    return `${event.event_type.replace(/[._]/g, ' ')} event`;
  }

  if (loading) {
    return (
      <div className={`p-4 text-sm text-muted-foreground ${className}`}>
        Loading timeline...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-sm text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">📋</div>
        <p className="text-sm font-medium text-gray-600 mb-1">No memory processing yet</p>
        <p className="text-xs text-gray-500">Add memories to see agent intelligence unfold</p>
      </div>
    );
  }

  // Filter events based on pipeline filter (with null safety)
  const filteredEvents = pipelineFilter === "all" 
    ? (events || [])
    : (events || []).filter(event => {
        if (!event || !event.event_type) return false;
        const config = getEventConfig(event.event_type);
        return (config as any).pipeline === pipelineFilter;
      });

  if (filteredEvents.length === 0 && pipelineFilter !== "all") {
    const filterMessages = {
      "P0_CAPTURE": "No memory captures yet",
      "P1_SUBSTRATE": "No substrate processing yet", 
      "P2_GRAPH": "No relationship mapping yet",
      "P3_REFLECTION": "No insights generated yet",
      "P4_PRESENTATION": "No documents composed yet",
      "QUEUE": "No queue processing events"
    };
    
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">🔍</div>
        <p className="text-sm font-medium text-gray-600">
          {filterMessages[pipelineFilter as keyof typeof filterMessages] || "No events found"}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Processing Status Bar */}
      {processingStats && processingStats.activeProcessing > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">
                Currently processing {processingStats.activeProcessing} item{processingStats.activeProcessing > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-blue-700">
              {processingStats.successRate.toFixed(0)}% success rate (24h)
            </span>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {filteredEvents.map((event, index) => {
          if (!event || !event.event_type) return null;
          const config = getEventConfig(event.event_type);
          const description = getEventDescription(event);
          const isLast = index === filteredEvents.length - 1;

          return (
            <div
              key={event.id}
              className="relative flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onEventClick?.(event)}
            >
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-7 top-10 bottom-0 w-px bg-border" />
              )}

              {/* Event icon */}
              <div className={`text-lg ${config.color} z-10 bg-background rounded-full p-1`}>
                {config.icon}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{config.label}</span>
                  <span className="text-xs text-gray-500">
                    {dayjsRef(event.created_at).fromNow()}
                  </span>
                </div>
                {description && (
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {description}
                  </p>
                )}
                
                {/* Processing-specific insights */}
                {event.event_type === "queue.processing_started" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-orange-600">Processing in progress...</span>
                  </div>
                ) : null}
                
                {event.event_type === "queue.processing_completed" && event.event_data?.duration_ms ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-600">
                      Completed in {(Number(event.event_data.duration_ms) / 1000).toFixed(1)}s
                    </span>
                  </div>
                ) : null}
                
                {event.event_type === "queue.processing_failed" && event.event_data?.error ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-600">
                      Failed: {String(event.event_data.error)}
                    </span>
                  </div>
                ) : null}
                
                {/* Show source/trigger information */}
                {event.event_data?.source ? (
                  <div className="text-xs text-gray-500 mt-1">
                    Started from {String(event.event_data.source)}
                  </div>
                ) : null}
                
                {/* Show agent attribution when available */}
                {event.processing_agent && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {event.processing_agent} agent
                      {event.agent_confidence && (
                        <span className="text-gray-500">
                          • {Math.round(event.agent_confidence * 100)}% confident
                        </span>
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="p-3 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}