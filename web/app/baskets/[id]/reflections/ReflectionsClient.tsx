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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter reflections based on search query
  const filteredReflections = reflections.filter(reflection =>
    !searchQuery || 
    reflection.reflection_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          className="mt-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          Add some content to your knowledge base and insights will automatically be discovered.
          Patterns, themes, and connections will appear here as your knowledge grows.
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
      {/* Search & Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredReflections.length} of {reflections.length} insights
            </span>
            <button
              onClick={refreshReflections}
              className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
            >
              <span>🔄</span>
              <span>Find New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredReflections.map((reflection, index) => (
          <div key={reflection.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Insight Header */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Discovery #{filteredReflections.length - index}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Found {formatComputationTime(reflection.computation_timestamp)}
                    </p>
                  </div>
                </div>
                {reflection.meta?.substrate_dump_count && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    From {reflection.meta.substrate_dump_count} sources
                  </span>
                )}
              </div>
            </div>

            {/* Insight Content */}
            <div className="px-6 py-6">
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {reflection.reflection_text}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Search Results */}
      {filteredReflections.length === 0 && searchQuery && reflections.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No insights match your search. Try a different term.
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Finding more..." : "Find More Insights"}
          </button>
        </div>
      )}
    </div>
  );
}