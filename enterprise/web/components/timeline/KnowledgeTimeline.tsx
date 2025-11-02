"use client";

import { useEffect, useState } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { TimelineEventDTO, TimelineEventKind } from '@/lib/timeline/types';

interface KnowledgeTimelineProps {
  basketId: string;
  className?: string;
  significance?: 'low' | 'medium' | 'high';
  limit?: number;
}

export default function KnowledgeTimeline({
  basketId,
  className = '',
  significance,
  limit = 50,
}: KnowledgeTimelineProps) {
  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [basketId, significance, limit]);

  async function loadTimeline() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`/api/baskets/${basketId}/timeline`, window.location.origin);
      url.searchParams.set('limit', limit.toString());
      if (significance) {
        url.searchParams.set('significance', significance);
      }

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error('Failed to load timeline');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error('[KnowledgeTimeline] loadTimeline failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="flex items-start gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="mb-2 text-rose-600">We couldn’t load this timeline right now.</div>
        <button type="button" onClick={loadTimeline} className="text-sm text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`mx-auto max-w-md py-12 text-center ${className}`}>
        <div className="mb-6 text-6xl text-gray-300">🌱</div>
        <h3 className="mb-3 text-xl font-semibold text-gray-900">Your knowledge journey starts here</h3>
        <p className="mb-6 text-gray-600">
          Add a capture or approve a change request to start building history for this basket. Every significant step
          will land here automatically.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = `/baskets/${basketId}/overview`;
          }}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Go to basket overview
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Knowledge milestones</h2>
        <div className="text-sm text-gray-500">
          {events.length} milestone{events.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg ${getSignificanceBackground(
                  event.significance,
                )}`}
              >
                {getEventIcon(event.kind)}
              </div>
              <div className="min-w-0 flex-1 pb-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className={`leading-snug ${getEventColor(event.significance)}`}>{event.title}</h3>
                    {event.description ? <p className="mt-1 text-sm leading-relaxed text-gray-600">{event.description}</p> : null}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-gray-400">
                    {event.host ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium uppercase tracking-wide text-indigo-600">
                        {event.host}
                      </span>
                    ) : null}
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                </div>

                {event.tags ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.tags.map((tag, idx) => (
                      <span key={`${event.id}-tag-${idx}`} className={getTagClass(tag.tone)}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {event.linkHref ? (
                  <div className="mt-3">
                    <a href={event.linkHref} className="text-sm text-blue-600 hover:underline">
                      {event.linkLabel || 'Open details'}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {events.length >= limit ? (
        <div className="pt-4 text-center text-sm text-gray-500">Earlier milestones coming soon.</div>
      ) : null}
    </div>
  );
}

function getEventIcon(kind: TimelineEventKind): string {
  switch (kind) {
    case 'capture':
      return '📝';
    case 'proposal':
      return '📋';
    case 'proposal_resolved':
      return '✅';
    case 'document':
      return '📄';
    case 'document_deleted':
      return '🗑️';
    case 'insight':
      return '💡';
    case 'block':
      return '🧱';
    case 'automation':
      return '🔧';
    case 'system':
    default:
      return '📌';
  }
}

function getSignificanceBackground(significance: 'low' | 'medium' | 'high'): string {
  switch (significance) {
    case 'high':
      return 'bg-indigo-100 text-indigo-700';
    case 'medium':
      return 'bg-slate-100 text-slate-700';
    case 'low':
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getEventColor(significance: 'low' | 'medium' | 'high'): string {
  switch (significance) {
    case 'high':
      return 'text-indigo-700';
    case 'medium':
      return 'text-slate-700';
    case 'low':
    default:
      return 'text-slate-600';
  }
}

function getTagClass(tone?: 'info' | 'warn' | 'danger') {
  switch (tone) {
    case 'warn':
      return 'rounded bg-amber-100 px-2 py-1 text-xs text-amber-700';
    case 'danger':
      return 'rounded bg-rose-100 px-2 py-1 text-xs text-rose-700';
    case 'info':
    default:
      return 'rounded bg-slate-100 px-2 py-1 text-xs text-slate-700';
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
