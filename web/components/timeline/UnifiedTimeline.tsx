"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import type { TimelineEventDTO } from "../../../shared/contracts/timeline";

let dayjsRef: any;

interface UnifiedTimelineProps {
  basketId: string;
  className?: string;
  onEventClick?: (event: TimelineEventDTO) => void;
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
}: UnifiedTimelineProps) {
  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");

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
  }, [basketId]);

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

      const data: TimelineResponse = await response.json();

      if (useCursor) {
        setEvents((prev) => [...prev, ...data.events]);
      } else {
        setEvents(data.events);
      }

      setHasMore(data.has_more);
      setCursor(data.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
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
      <div className={`p-4 text-sm text-muted-foreground ${className}`}>
        No events yet
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-0">
        {events.map((event, index) => {
          const config = getEventConfig(event.event_type);
          const description = getEventDescription(event);
          const isLast = index === events.length - 1;

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
                  <span className="text-sm font-medium">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {dayjsRef(event.created_at).fromNow()}
                  </span>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {description}
                  </p>
                )}
                {/* Show agent attribution when available */}
                {event.processing_agent && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Processed by {event.processing_agent}
                      {event.agent_confidence && (
                        <span className="text-gray-500">
                          ({Math.round(event.agent_confidence * 100)}% confidence)
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