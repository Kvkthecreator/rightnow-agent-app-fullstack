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
import { SubpageHeader } from "@/components/basket/SubpageHeader";
import { ProposalDetailModal } from "@/components/governance/ProposalDetailModal";

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

interface GovernanceClientProps {
  basketId: string;
}

export default function GovernanceClient({ basketId }: GovernanceClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  type StatusFilterType = 'all' | 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

  useEffect(() => {
    const fetchProposals = async () => {
      if (!basketId) return;
      
      console.log('Fetching proposals for basket:', basketId, 'with filter:', statusFilter);
      setLoading(true);
      setError(null);

      try {
        const url = `/api/baskets/${basketId}/proposals${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
        console.log('Fetching from URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response Error:', response.status, response.statusText, errorText);
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched proposals data:', data);
        setProposals(data.items || []);
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setProposals([]);
      }
      setLoading(false);
    };

    if (basketId) {
      fetchProposals();
    }
  }, [basketId, statusFilter]);

  const openProposalDetail = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setIsDetailModalOpen(true);
  };

  const closeProposalDetail = () => {
    setSelectedProposalId(null);
    setIsDetailModalOpen(false);
  };

  const handleApprove = async (proposalId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: notes || 'Approved via governance queue' })
      });
      
      if (response.ok) {
        // Trigger re-fetch by updating statusFilter
        setStatusFilter(prev => prev);
      }
    } catch (error) {
      console.error('Failed to approve proposal:', error);
    }
  };

  const handleReject = async (proposalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          review_notes: 'Rejected via governance queue',
          reason: reason
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Proposals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  const filterComponent = (
    <label className="text-sm font-medium text-gray-700">
      Filter:
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
        className="ml-2 border border-gray-300 rounded px-3 py-1"
      >
        <option value="all">All Proposals</option>
        <option value="PROPOSED">Proposed</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="border-b p-4">
        <SubpageHeader 
          title="Change Requests" 
          basketId={basketId}
          description="Review and approve substrate change proposals"
          rightContent={filterComponent}
        />
      </div>

      {/* Proposals List */}
      <div className="space-y-4 p-4">
        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
            <p className="text-gray-600">No change requests match the current filter.</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white border rounded-lg shadow-sm" data-testid="proposal-card">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{proposal.proposal_kind}</Badge>
                      <Badge variant={proposal.status === 'PROPOSED' ? 'default' : 'secondary'}>
                        {proposal.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {proposal.ops_summary}
                    </h3>
                    
                    <p className="text-gray-700 mb-3">
                      {proposal.impact_summary}
                    </p>

                    {proposal.validator_report && (
                      <div className="space-y-2">
                        {proposal.validator_report.warnings.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
                            <ul className="text-sm text-yellow-700 mt-1">
                              {proposal.validator_report.warnings.map((warning, i) => (
                                <li key={i}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {proposal.validator_report.ontology_hits.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <h4 className="text-sm font-medium text-blue-800">Ontology Matches:</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {proposal.validator_report.ontology_hits.map((hit, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {hit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => openProposalDetail(proposal.id)}
                      variant="outline"
                      size="sm"
                    >
                      Review Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ProposalDetailModal
        isOpen={isDetailModalOpen}
        proposalId={selectedProposalId}
        basketId={basketId}
        onClose={closeProposalDetail}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}