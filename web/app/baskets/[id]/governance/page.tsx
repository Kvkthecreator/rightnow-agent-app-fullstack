/* Unified Governance Queue - Basket Scoped
   Lists proposals from all substrate types (blocks, context_items)
   User can Approve → commits operations | Reject → archives proposal
   Implements YARNNN_GOVERNANCE_CANON.md review interface
*/
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/clients";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Proposal {
  id: string;
  proposal_kind: string;
  origin: string;
  status: string;
  ops_summary: string;
  confidence: number;
  impact_summary: string;
  created_at: string;
  validator_report: {
    dupes: unknown[];
    warnings: string[];
    suggested_merges: string[];
    ontology_hits: string[];
  };
  provenance: string[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GovernancePage({ params }: PageProps) {
  const [basketId, setBasketId] = useState<string>("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'>('all');

  type StatusFilterType = 'all' | 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

  // Extract basket ID from params
  useEffect(() => {
    params.then(({ id }) => {
      setBasketId(id);
    });
  }, [params]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!basketId) return;
      
      setLoading(true);
      try {
        const url = `/api/baskets/${basketId}/proposals${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setProposals(data.items || []);
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
        setProposals([]);
      }
      setLoading(false);
    };

    if (basketId) {
      fetchProposals();
    }
  }, [basketId, statusFilter]);

  const handleApprove = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: 'Approved via governance queue' })
      });
      
      if (response.ok) {
        // Trigger re-fetch by updating statusFilter
        setStatusFilter(prev => prev);
      }
    } catch (error) {
      console.error('Failed to approve proposal:', error);
    }
  };

  const handleReject = async (proposalId: string, reason: string = '') => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          review_notes: 'Rejected via governance queue',
          reason: reason || 'No reason provided'
        })
      });
      
      if (response.ok) {
        // Trigger re-fetch by updating statusFilter
        setStatusFilter(prev => prev);
      }
    } catch (error) {
      console.error('Failed to reject proposal:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROPOSED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOriginColor = (origin: string) => {
    return origin === 'agent' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 font-semibold';
    if (confidence >= 0.6) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Change Requests</h1>
        <div className="text-sm text-muted-foreground">
          YARNNN Governance Canon v2.0 - Unified Substrate Review
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            className="border rounded p-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
          >
            <option value="all">All Proposals</option>
            <option value="PROPOSED">Proposed</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Loading and Empty States */}
      {loading && <p className="text-center py-8">Loading proposals...</p>}
      {!loading && proposals.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          No proposals found for selected filters 🎉
        </p>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="border rounded-lg p-6 space-y-4 bg-white shadow-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{proposal.ops_summary}</h3>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                  <Badge className={getOriginColor(proposal.origin)}>
                    {proposal.origin}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Kind: {proposal.proposal_kind}</span>
                  <span>Created: {new Date(proposal.created_at).toLocaleString()}</span>
                  <span className={getConfidenceColor(proposal.confidence)}>
                    Confidence: {(proposal.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              {(proposal.status === 'PROPOSED' || proposal.status === 'UNDER_REVIEW') && (
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => handleApprove(proposal.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(proposal.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>

            {/* Impact Analysis */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-medium mb-2">Impact Analysis</div>
              <div className="text-sm text-gray-700">{proposal.impact_summary}</div>
            </div>

            {/* Validation Report */}
            {proposal.validator_report && (
              <div className="space-y-2">
                {proposal.validator_report.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="text-sm font-medium text-yellow-800 mb-1">Warnings</div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {proposal.validator_report.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {proposal.validator_report.dupes.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="text-sm font-medium text-orange-800 mb-1">Potential Duplicates</div>
                    <div className="text-sm text-orange-700">
                      {proposal.validator_report.dupes.length} potential duplicate(s) detected
                    </div>
                  </div>
                )}
                
                {proposal.validator_report.suggested_merges.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Merge Suggestions</div>
                    <div className="text-sm text-blue-700">
                      {proposal.validator_report.suggested_merges.length} items suggested for merge
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provenance */}
            {proposal.provenance.length > 0 && (
              <div className="text-xs text-gray-500">
                Provenance: {proposal.provenance.length} raw dump(s)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}