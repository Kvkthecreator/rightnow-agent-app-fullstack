"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface InsightCanonCardProps {
  basketId: string;
  compact?: boolean;
  onInsightGenerated?: () => void;
}

interface InsightCanon {
  id: string;
  reflection_text: string;
  created_at: string;
  substrate_hash?: string;
  graph_signature?: string;
  is_current: boolean;
}

export default function InsightCanonCard({
  basketId,
  compact = false,
  onInsightGenerated
}: InsightCanonCardProps) {
  const [insight, setInsight] = useState<InsightCanon | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  async function loadInsight() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('reflections_artifact')
        .select('id, reflection_text, created_at, substrate_hash, graph_signature, is_current')
        .eq('basket_id', basketId)
        .eq('insight_type', 'insight_canon')
        .eq('is_current', true)
        .maybeSingle();

      if (queryError) throw queryError;

      // Auto-seed if missing (validate-and-seed pattern)
      if (!data) {
        console.log('No insight found, auto-seeding...');
        await generateInsight(false);
        return;
      }

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
      onInsightGenerated?.();
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-sm text-gray-600">Loading insight...</span>
        </div>
      </div>
    );
  }

  if (error && !insight) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load insight</span>
        </div>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        <Button
          onClick={() => loadInsight()}
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!insight) {
    // Empty state (shouldn't happen due to auto-seed, but safety)
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-2">No Insight Yet</h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate your first insight to understand what matters in this basket
        </p>
        <Button
          onClick={() => generateInsight(false)}
          disabled={generating}
          variant="primary"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Insight
            </>
          )}
        </Button>
      </div>
    );
  }

  // Compact mode for /memory page
  if (compact) {
    const truncatedText = insight.reflection_text.length > 200
      ? insight.reflection_text.substring(0, 200) + '...'
      : insight.reflection_text;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-purple-300 transition-colors">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Current Insight</h3>
                <p className="text-xs text-gray-500">Generated {formatTime(insight.created_at)}</p>
              </div>
            </div>
            <Button
              onClick={() => generateInsight(true)}
              disabled={generating}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {truncatedText}
          </div>
        </div>
      </div>
    );
  }

  // Full mode for /insights page
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Insight Canon</h3>
              <p className="text-sm text-gray-500">
                Generated {formatTime(insight.created_at)}
              </p>
            </div>
          </div>
          <Button
            onClick={() => generateInsight(true)}
            disabled={generating}
            variant="outline"
            size="sm"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {insight.reflection_text}
        </div>
      </div>

      {/* Metadata footer */}
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

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-6 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
