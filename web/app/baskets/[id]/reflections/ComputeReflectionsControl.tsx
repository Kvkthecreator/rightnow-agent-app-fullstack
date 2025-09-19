"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface Props {
  basketId: string;
}

type ReflectionScope = 'all_content' | 'recent_activity' | 'specific_document' | 'proposal';

export default function ComputeReflectionsControl({ basketId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [scope, setScope] = useState<ReflectionScope>('recent_activity');
  const [documentId, setDocumentId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompute() {
    setLoading(true);
    setError(null);
    try {
      let body: any = { basket_id: basketId, force_refresh: true };

      // Map user-friendly scopes to backend format
      switch (scope) {
        case 'all_content':
          body.scope = 'window';
          body.substrate_window_hours = 24 * 30; // 30 days
          break;
        case 'recent_activity':
          body.scope = 'window';
          body.substrate_window_hours = 24 * 7; // 7 days
          break;
        case 'specific_document':
          if (!documentId) {
            setError('Please select a document');
            setLoading(false);
            return;
          }
          body.scope = 'document';
          body.document_id = documentId;
          break;
        case 'proposal':
          if (!proposalId) {
            setError('Please select a proposal');
            setLoading(false);
            return;
          }
          body.scope = 'proposal';
          body.proposal_id = proposalId;
          break;
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
        Find Insights
      </Button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Find Insights</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">What would you like insights about?</label>
                <select 
                  value={scope} 
                  onChange={(e) => setScope(e.target.value as ReflectionScope)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="recent_activity">Recent activity (last week)</option>
                  <option value="all_content">All your content</option>
                  <option value="specific_document">A specific document</option>
                  <option value="proposal">A change request proposal</option>
                </select>
              </div>
              
              {scope === 'specific_document' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Document</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Enter document name or ID"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Get insights about themes, assumptions, or gaps in a specific document</p>
                </div>
              )}
              
              {scope === 'proposal' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Proposal</label>
                  <input
                    type="text"
                    value={proposalId}
                    onChange={(e) => setProposalId(e.target.value)}
                    placeholder="Enter proposal ID"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Analyze potential impact and implications of a proposed change</p>
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
                {loading ? 'Analyzing...' : 'Find Insights'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
