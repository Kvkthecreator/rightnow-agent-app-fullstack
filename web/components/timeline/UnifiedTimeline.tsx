"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import type { TimelineEventDTO } from "../../../shared/contracts/timeline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

// Event type icons and labels
const EVENT_CONFIG = {
  "dump.created": {
    icon: "📄",
    label: "Memory added",
    color: "text-blue-600",
  },
  "reflection.computed": {
    icon: "🤔",
    label: "Reflection",
    color: "text-purple-600",
  },
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
  "document.created": {
    icon: "📝",
    label: "Document created",
    color: "text-indigo-600",
  },
  "document.updated": {
    icon: "✏️",
    label: "Document updated",
    color: "text-indigo-500",
  },
  "block.created": {
    icon: "🧱",
    label: "Block created",
    color: "text-orange-600",
  },
  "block.updated": {
    icon: "🔧",
    label: "Block updated",
    color: "text-orange-500",
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

  function getEventDescription(event: TimelineEventDTO): string {
    switch (event.event_type) {
      case "dump.created":
        const charCount = event.event_data.char_count as number | undefined;
        return charCount ? `${charCount} characters` : "File uploaded";
      case "reflection.computed":
        return "New insights generated";
      case "document.created":
        const title = event.event_data.title as string | undefined;
        return title || "Untitled";
      case "document.updated":
        const blockCount = event.event_data.block_count as number | undefined;
        return blockCount ? `${blockCount} blocks` : "Updated";
      default:
        return "";
    }
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
                    {dayjs(event.created_at).fromNow()}
                  </span>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {description}
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