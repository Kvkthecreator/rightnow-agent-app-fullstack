"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface Props {
  basketId: string;
}

export default function ComputeReflectionsControl({ basketId }: Props) {
  const [showModal, setShowModal] = useState(false);
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

      window.dispatchEvent(new CustomEvent('reflections:refresh'));
      setShowModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to request reflections');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setShowModal(true)}>
        Find New Insights
      </Button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Find Insights</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Source</label>
                <select 
                  value={scope} 
                  onChange={(e) => setScope(e.target.value as 'window' | 'event')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="window">Recent activity</option>
                  <option value="event">Specific event</option>
                </select>
              </div>
              
              {scope === 'event' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Event ID</label>
                  <input
                    type="text"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    placeholder="Enter event ID"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
              
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCompute} disabled={loading}>
                {loading ? 'Processing...' : 'Find Insights'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
