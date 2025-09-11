"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface Props {
  basketId: string;
}

export default function ComputeReflectionsControl({ basketId }: Props) {
  const [scope, setScope] = useState<'window' | 'event'>('window');
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompute() {
    setLoading(true);
    setError(null);
    try {
      const body: any = scope === 'event'
        ? { scope: 'event', event_id: eventId }
        : { basket_id: basketId, force_refresh: true };

      // For window scope, the API expects basket_id (and derives workspace)
      // For event scope, it only needs event_id
      if (scope === 'window') {
        body.scope = 'window';
        body.basket_id = basketId;
      } else {
        if (!eventId) {
          setError('Please provide an event ID');
          setLoading(false);
          return;
        }
      }

      const resp = await fetchWithToken('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error((data && (data.error || data.detail)) || `Request failed (${resp.status})`);
      }

      // Notify the list to refresh
      window.dispatchEvent(new CustomEvent('reflections:refresh'));
    } catch (e: any) {
      setError(e?.message || 'Failed to request reflections');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <Select value={scope} onValueChange={(v) => setScope(v as 'window' | 'event')}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="window">From recent activity</SelectItem>
            <SelectItem value="event">From specific event…</SelectItem>
          </SelectContent>
        </Select>
        {scope === 'event' && (
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Event ID"
            className="h-9 w-52 rounded-md border border-gray-300 px-2 text-sm"
          />
        )}
      </div>
      <Button size="sm" onClick={handleCompute} disabled={loading}>
        {loading ? 'Requesting…' : 'Find New Insights'}
      </Button>
      {error && (
        <span className="ml-2 text-xs text-red-600 max-w-xs truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
