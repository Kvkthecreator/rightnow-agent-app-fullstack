"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { GetReflectionsResponse, ReflectionDTO } from '../../../../../shared/contracts/reflections';

interface ReflectionsClientProps {
  basketId: string;
}

export default function ReflectionsClient({ basketId }: ReflectionsClientProps) {
  const [reflections, setReflections] = useState<ReflectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  // Load reflections from API
  async function loadReflections(useCursor?: string) {
    try {
      const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
      if (useCursor) {
        url.searchParams.set("cursor", useCursor);
      }
      url.searchParams.set("limit", "10");

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load reflections");
      }

      const data: GetReflectionsResponse = await response.json();

      if (useCursor) {
        setReflections((prev) => [...prev, ...data.reflections]);
      } else {
        setReflections(data.reflections);
      }

      setHasMore(data.has_more);
      setCursor(data.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reflections");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function loadMore() {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    await loadReflections(cursor);
  }

  // Force refresh reflections
  async function refreshReflections() {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
      url.searchParams.set("refresh", "true");
      url.searchParams.set("limit", "10");

      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to refresh reflections");
      }

      const data: GetReflectionsResponse = await response.json();
      setReflections(data.reflections);
      setHasMore(data.has_more);
      setCursor(data.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh reflections");
    } finally {
      setLoading(false);
    }
  }

  // Format time window for display
  function formatTimeWindow(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    
    // If window is recent (within 24 hours), show relative time
    const hoursAgo = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      return `Last ${Math.round(duration)} hours`;
    }
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  // Format computation time for display
  function formatComputationTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffHours * 60);
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)} hours ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} days ago`;
    }
  }

  // Load initial data
  useEffect(() => {
    loadReflections();
  }, [basketId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-28 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load reflections</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={() => loadReflections()}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (reflections.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤔</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reflections Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          The P3 Reflection Agent will generate insights once you have substrate to analyze.
          Add some memory to your basket to get started.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={refreshReflections}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 Check for Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {reflections.length} insight{reflections.length !== 1 ? 's' : ''} discovered
        </div>
        <button
          onClick={refreshReflections}
          className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Reflections List */}
      <div className="space-y-4">
        {reflections.map((reflection, index) => (
          <div key={reflection.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Reflection Header */}
            <div className="border-b border-gray-100 px-6 py-3 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-sm font-medium text-purple-800">
                    Insight #{reflections.length - index}
                  </span>
                  <span className="text-xs text-purple-600">
                    {formatTimeWindow(reflection.substrate_window_start, reflection.substrate_window_end)}
                  </span>
                </div>
                <div className="text-xs text-purple-600">
                  {formatComputationTime(reflection.computation_timestamp)}
                </div>
              </div>
            </div>

            {/* Reflection Content */}
            <div className="px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800">
                  {reflection.reflection_text}
                </div>
              </div>
            </div>

            {/* Reflection Metadata */}
            {reflection.meta && (
              <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {reflection.meta.substrate_dump_count && (
                    <div className="flex items-center gap-1">
                      <span>📄</span>
                      <span>{reflection.meta.substrate_dump_count} sources</span>
                    </div>
                  )}
                  {reflection.meta.substrate_tokens && (
                    <div className="flex items-center gap-1">
                      <span>🧮</span>
                      <span>{reflection.meta.substrate_tokens.toLocaleString()} tokens analyzed</span>
                    </div>
                  )}
                  {reflection.meta.computation_trace_id && (
                    <div className="flex items-center gap-1">
                      <span>🔍</span>
                      <span>Trace {reflection.meta.computation_trace_id.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Insights"}
          </button>
        </div>
      )}
    </div>
  );
}