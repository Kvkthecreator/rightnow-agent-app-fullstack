"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface DocumentCanonBannerProps {
  basketId: string;
}

interface DocumentCanonHealth {
  has_document_canon: boolean;
  has_prompt_starter: boolean;
  document_canon_stale: boolean;
  prompt_starter_stale: boolean;
}

/**
 * Document Page Health Banner
 *
 * Shows status and generation controls for document-related items:
 * - Composition Guide (helps create documents)
 * - Prompt Starter Pack (ready-to-use prompts)
 *
 * Note: Insights are handled separately on the Insights page.
 * This banner is only for P4 document concerns.
 */
export function DocumentCanonBanner({ basketId }: DocumentCanonBannerProps) {
  const [health, setHealth] = useState<DocumentCanonHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadHealth() {
    try {
      const response = await fetchWithToken(`/api/health/basket/${basketId}`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to load document canon health:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateP4Canons() {
    setGenerating(true);
    try {
      // Generate P4 document canon
      const docResponse = await fetchWithToken('/api/p4/document-canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, force: false })
      });

      if (!docResponse.ok) throw new Error('Failed to generate document canon');

      // Generate prompt starter pack
      const promptResponse = await fetchWithToken('/api/p4/starter-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, target_host: 'chatgpt' })
      });

      if (!promptResponse.ok) throw new Error('Failed to generate prompt starter');

      // Reload health
      await loadHealth();
    } catch (err) {
      console.error('P4 canon generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, [basketId]);

  if (loading || !health) return null;

  // Only show banner if P4 canons are missing or stale
  const needsGeneration = !health.has_document_canon || !health.has_prompt_starter;
  const needsRegeneration = health.document_canon_stale || health.prompt_starter_stale;
  const ready = !needsGeneration && !needsRegeneration;

  if (ready) return null;

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
              {needsGeneration ? 'Key Documents Setup Required' : 'Documents Update Available'}
            </h3>
            <p className={`text-xs ${needsGeneration ? 'text-purple-700' : 'text-orange-700'}`}>
              {needsGeneration
                ? 'Generate your composition guide and starter prompt pack to begin creating documents.'
                : 'Your knowledge has changed. Regenerate to refresh your composition guide.'}
            </p>
          </div>
        </div>
        <button
          onClick={generateP4Canons}
          disabled={generating}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50
            ${needsGeneration
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-orange-600 text-white hover:bg-orange-700'}
          `}
        >
          {generating ? '🔄 Generating…' : needsGeneration ? '✨ Generate Key Documents' : '🔄 Regenerate'}
        </button>
      </div>
    </div>
  );
}
