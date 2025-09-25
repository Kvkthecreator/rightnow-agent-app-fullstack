"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fetchWithToken } from '@/lib/fetchWithToken';

type ReflectionMode = 'recent' | 'all';

interface Props {
  basketId: string;
  /**
   * Determines the substrate window the trigger will analyze.
   * - `recent`: default 7-day window
   * - `all`: analyze full basket history (no hour constraint)
   */
  mode?: ReflectionMode;
  label?: string;
  /** Override default window hours for recent mode */
  windowHours?: number;
}

const DEFAULT_RECENT_WINDOW_HOURS = 24 * 7; // one week

export default function ComputeReflectionsControl({
  basketId,
  mode = 'recent',
  label = 'Find Insights',
  windowHours,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompute() {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        basket_id: basketId,
        scope: 'window',
        force_refresh: true,
      };

      if (mode === 'recent') {
        payload.substrate_window_hours = windowHours ?? DEFAULT_RECENT_WINDOW_HOURS;
      }

      const resp = await fetchWithToken('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error((data && (data.error || data.detail)) || `Request failed (${resp.status})`);
      }

      window.dispatchEvent(new CustomEvent('reflections:refresh'));
    } catch (e: any) {
      setError(e?.message || 'Failed to request reflections');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleCompute} disabled={loading}>
        {loading ? 'Analyzing…' : label}
      </Button>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-xs text-right">{error}</p>
      ) : null}
    </div>
  );
}
