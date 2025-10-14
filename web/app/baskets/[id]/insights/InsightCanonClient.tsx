"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface InsightCanonClientProps {
  basketId: string;
}

interface InsightCanon {
  id: string;
  reflection_text: string;
  created_at: string;
  substrate_hash?: string;
  graph_signature?: string;
}

export default function InsightCanonClient({ basketId }: InsightCanonClientProps) {
  const [insight, setInsight] = useState<InsightCanon | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  async function loadInsight() {
    try {
      setLoading(true);
      setError(null);

      // Query current insight canon directly from Supabase
      const { data, error: queryError } = await supabase
        .from('reflections_artifact')
        .select('id, reflection_text, created_at, substrate_hash, graph_signature')
        .eq('basket_id', basketId)
        .eq('insight_type', 'insight_canon')
        .eq('is_current', true)
        .maybeSingle();

      if (queryError) throw queryError;
      setInsight(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insight');
    } finally {
      setLoading(false);
    }
  }

  async function generateInsight(force: boolean = false) {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetchWithToken('/api/p3/insight-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate insight');
      }

      await loadInsight();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
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
    loadInsight();
  }, [basketId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
      </div>
    );
  }

  if (error && !insight) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={() => loadInsight()}
          className="mt-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Insight Display */}
      {insight ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Insight Canon</h3>
                  <p className="text-sm text-gray-500">
                    Generated {formatTime(insight.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => generateInsight(true)}
                disabled={generating}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                {generating ? '🔄 Regenerating...' : '🔄 Regenerate'}
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {insight.reflection_text}
            </div>
          </div>

          {/* Metadata */}
          {(insight.substrate_hash || insight.graph_signature) && (
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
              <div className="flex gap-6 text-xs text-gray-500">
                {insight.substrate_hash && (
                  <div>
                    <span className="font-medium">Substrate: </span>
                    <span className="font-mono">{insight.substrate_hash.substring(0, 8)}...</span>
                  </div>
                )}
                {insight.graph_signature && (
                  <div>
                    <span className="font-medium">Graph: </span>
                    <span className="font-mono">{insight.graph_signature.substring(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Insight Canon Yet</h3>
          <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
            Your basket's Insight Canon is the core understanding of "what matters now".
            Generate it to unlock context-aware documents and deeper insights.
          </p>
          <button
            onClick={() => generateInsight(false)}
            disabled={generating}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {generating ? '🔄 Generating...' : '✨ Generate Insight Canon'}
          </button>
        </div>
      )}

      {error && insight && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
