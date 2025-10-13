"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface InsightCanonClientProps {
  basketId: string;
}

interface InsightCanon {
  id: string;
  reflection_text: string;
  substrate_hash: string;
  graph_signature: string;
  derived_from: Array<{ type: string; id: string }>;
  created_at: string;
  previous_id?: string | null;
}

interface HealthCheck {
  has_insight_canon: boolean;
  insight_canon_stale: boolean;
  insight_check: {
    stale: boolean;
    reasons: {
      substrate_changed?: boolean;
      graph_changed?: boolean;
      missing?: boolean;
    };
    current_canon?: InsightCanon;
    substrate_delta?: {
      blocks_active: number;
      context_items_active: number;
      dumps_total: number;
    };
  };
}

export default function InsightCanonClient({ basketId }: InsightCanonClientProps) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function loadHealth() {
    try {
      setLoading(true);
      const response = await fetchWithToken(`/api/health/basket/${basketId}`);
      if (!response.ok) throw new Error('Failed to load canon health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function generateCanon() {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetchWithToken('/api/p3/insight-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force: false })
      });

      if (!response.ok) throw new Error('Failed to generate insight');

      // Reload health after generation
      await loadHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateCanon() {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetchWithToken('/api/p3/insight-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force: true })
      });

      if (!response.ok) throw new Error('Failed to regenerate insight');

      await loadHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setGenerating(false);
    }
  }

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.round(diffHours * 60)} minutes ago`;
    if (diffHours < 24) return `${Math.round(diffHours)} hours ago`;
    return `${Math.round(diffHours / 24)} days ago`;
  }

  useEffect(() => {
    loadHealth();
  }, [basketId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={loadHealth}
          className="mt-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const canon = health?.insight_check?.current_canon;
  const isMissing = health?.insight_check?.reasons?.missing;
  const isStale = health?.insight_canon_stale && !isMissing;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isMissing ? '❓' : isStale ? '⚠️' : '✅'}
            </span>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {isMissing ? 'No Insight Canon' : isStale ? 'Insight Canon is Stale' : 'Insight Canon is Fresh'}
              </h3>
              <p className="text-xs text-gray-500">
                {isMissing
                  ? 'Generate your first basket insight'
                  : isStale
                  ? 'Substrate or relationships have changed'
                  : 'Up to date with current substrate'}
              </p>
            </div>
          </div>
          <div>
            {isMissing ? (
              <button
                onClick={generateCanon}
                disabled={generating}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {generating ? '🔄 Generating...' : '✨ Generate Canon'}
              </button>
            ) : isStale ? (
              <button
                onClick={regenerateCanon}
                disabled={generating}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {generating ? '🔄 Regenerating...' : '🔄 Regenerate'}
              </button>
            ) : (
              <button
                onClick={regenerateCanon}
                disabled={generating}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate Anyway'}
              </button>
            )}
          </div>
        </div>

        {/* Staleness Details */}
        {isStale && health?.insight_check?.reasons && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Changes detected:</div>
              {health.insight_check.reasons.substrate_changed && (
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Substrate modified ({health.insight_check.substrate_delta?.blocks_active || 0} blocks, {health.insight_check.substrate_delta?.dumps_total || 0} dumps)</span>
                </div>
              )}
              {health.insight_check.reasons.graph_changed && (
                <div className="flex items-center gap-2">
                  <span>🔗</span>
                  <span>Relationships changed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Current Canon Display */}
      {canon && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Insight Canon</h3>
                  <p className="text-sm text-gray-500">
                    Generated {formatTime(canon.created_at)}
                  </p>
                </div>
              </div>
              {canon.previous_id && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  {showHistory ? 'Hide' : 'Show'} Version History
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {canon.reflection_text}
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
            <div className="flex gap-6 text-xs text-gray-500">
              <div>
                <span className="font-medium">Sources: </span>
                <span>{canon.derived_from?.length || 0} items</span>
              </div>
              <div>
                <span className="font-medium">Substrate Hash: </span>
                <span className="font-mono">{canon.substrate_hash.substring(0, 8)}...</span>
              </div>
              <div>
                <span className="font-medium">Graph Signature: </span>
                <span className="font-mono">{canon.graph_signature.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Missing Canon */}
      {isMissing && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Insight Canon Yet</h3>
          <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
            Your basket's Insight Canon is the core understanding of "what matters now".
            Generate it to unlock context-aware documents and deeper insights.
          </p>
        </div>
      )}
    </div>
  );
}
