"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { useRouter } from 'next/navigation';

interface CanonHealthBannerProps {
  basketId: string;
}

interface HealthCheck {
  has_insight_canon: boolean;
  has_document_canon: boolean;
  insight_canon_stale: boolean;
  document_canon_stale: boolean;
  ready: boolean;
}

export function CanonHealthBanner({ basketId }: CanonHealthBannerProps) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  async function loadHealth() {
    try {
      const response = await fetchWithToken(`/api/health/basket/${basketId}`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to load canon health:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateCanons() {
    setGenerating(true);
    try {
      // Generate P3 insight canon first
      const insightResponse = await fetchWithToken('/api/p3/insight-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force: false })
      });

      if (!insightResponse.ok) throw new Error('Failed to generate insight canon');

      // Then generate P4 document canon
      const docResponse = await fetchWithToken('/api/p4/document-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force: false })
      });

      if (!docResponse.ok) throw new Error('Failed to generate document canon');

      // Reload health
      await loadHealth();
    } catch (err) {
      console.error('Canon generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, [basketId]);

  if (loading || !health) return null;

  // Only show banner if canons are missing or stale
  if (health.ready) return null;

  const needsGeneration = !health.has_insight_canon || !health.has_document_canon;
  const needsRegeneration = health.insight_canon_stale || health.document_canon_stale;

  return (
    <div className={`
      rounded-lg border p-4 mb-4
      ${needsGeneration ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{needsGeneration ? '📋' : '⚠️'}</span>
          <div>
            <h3 className={`text-sm font-medium ${needsGeneration ? 'text-purple-900' : 'text-orange-900'}`}>
              {needsGeneration ? 'Canon Setup Required' : 'Canon Update Available'}
            </h3>
            <p className={`text-xs ${needsGeneration ? 'text-purple-700' : 'text-orange-700'}`}>
              {needsGeneration
                ? 'Generate Insight and Document Canons to unlock full functionality'
                : 'Your substrate has changed. Regenerate canons for up-to-date insights.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!health.has_insight_canon && (
            <button
              onClick={() => router.push(`/baskets/${basketId}/reflections`)}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              View Insights
            </button>
          )}
          <button
            onClick={generateCanons}
            disabled={generating}
            className={`
              px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50
              ${needsGeneration
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'}
            `}
          >
            {generating ? '🔄 Generating...' : needsGeneration ? '✨ Generate Canons' : '🔄 Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
}
