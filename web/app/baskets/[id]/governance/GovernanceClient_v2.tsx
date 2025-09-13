/**
 * Focused Governance Client - First Principles Refactor
 * 
 * Eliminates redundancy and information overload:
 * - Clean, scannable proposal cards
 * - Risk-based visual priorities  
 * - Quick actions for high-confidence proposals
 * - Focused detail modal
 */
"use client";

import { useEffect, useState } from "react";
import { SubpageHeader } from "@/components/basket/SubpageHeader";
import { ProposalCard } from "@/components/governance/ProposalCard";
import { ProposalDetailModal } from "@/components/governance/ProposalDetailModal_v2";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Proposal {
  id: string;
  proposal_kind: string;
  origin: string;
  status: string;
  ops_summary: string;
  validator_report: {
    confidence: number;
    warnings: string[];
    impact_summary: string;
  };
  blast_radius: 'Local' | 'Scoped' | 'Global';
  created_at: string;
  provenance: string[];
}

interface GovernanceClientProps {
  basketId: string;
}

export default function GovernanceClient({ basketId }: GovernanceClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready' | 'critical'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, [basketId]);

  const fetchProposals = async () => {
    if (!basketId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setProposals(data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load proposals');
      setProposals([]);
    }
    setLoading(false);
  };

  const openProposalDetail = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setIsDetailModalOpen(true);
  };

  const closeProposalDetail = () => {
    setSelectedProposalId(null);
    setIsDetailModalOpen(false);
  };

  const handleQuickApprove = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: 'Quick approved - high confidence' })
      });
      
      if (response.ok) {
        await fetchProposals();
      }
    } catch (error) {
      console.error('Quick approve failed:', error);
    }
  };

  const handleApprove = async (proposalId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: notes || 'Approved via governance review' })
      });
      
      if (response.ok) {
        await fetchProposals();
      }
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async (proposalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          review_notes: 'Rejected via governance review',
          reason: reason
        })
      });
      
      if (response.ok) {
        await fetchProposals();
      }
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  // Filter proposals by priority/status
  const getFilteredProposals = () => {
    const activeProposals = proposals.filter(p => p.status === 'PROPOSED');
    
    if (statusFilter === 'all') return activeProposals;
    
    return activeProposals.filter(proposal => {
      const confidence = proposal.validator_report.confidence;
      const hasWarnings = proposal.validator_report.warnings.length > 0;
      const hasCriticalWarnings = proposal.validator_report.warnings.some(w => 
        w.includes('CRITICAL') || w.includes('CONFLICT')
      );

      switch (statusFilter) {
        case 'critical':
          return hasCriticalWarnings || confidence < 0.3;
        case 'ready':
          return confidence > 0.8 && !hasWarnings;
        case 'pending':
          return (confidence <= 0.8 && confidence >= 0.3) || (hasWarnings && !hasCriticalWarnings);
        default:
          return true;
      }
    });
  };

  const getFilterCounts = () => {
    const activeProposals = proposals.filter(p => p.status === 'PROPOSED');
    
    const counts = {
      all: activeProposals.length,
      critical: 0,
      ready: 0,
      pending: 0
    };

    activeProposals.forEach(proposal => {
      const confidence = proposal.validator_report.confidence;
      const hasWarnings = proposal.validator_report.warnings.length > 0;
      const hasCriticalWarnings = proposal.validator_report.warnings.some(w => 
        w.includes('CRITICAL') || w.includes('CONFLICT')
      );

      if (hasCriticalWarnings || confidence < 0.3) {
        counts.critical++;
      } else if (confidence > 0.8 && !hasWarnings) {
        counts.ready++;
      } else {
        counts.pending++;
      }
    });

    return counts;
  };

  const filteredProposals = getFilteredProposals();
  const filterCounts = getFilterCounts();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Proposals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchProposals}>Retry</Button>
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
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Filter:</span>
      <div className="flex gap-1">
        {[
          { key: 'all', label: 'All', count: filterCounts.all },
          { key: 'critical', label: 'Critical', count: filterCounts.critical },
          { key: 'ready', label: 'Ready', count: filterCounts.ready },
          { key: 'pending', label: 'Review', count: filterCounts.pending },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key as any)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              statusFilter === filter.key
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <Badge 
                variant="outline" 
                className={`ml-1 text-xs ${
                  filter.key === 'critical' ? 'border-red-500 text-red-600' :
                  filter.key === 'ready' ? 'border-green-500 text-green-600' :
                  'border-gray-400 text-gray-600'
                }`}
              >
                {filter.count}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b p-4">
        <SubpageHeader 
          title="Change Requests" 
          basketId={basketId}
          description="Review and approve substrate changes"
          rightContent={filterComponent}
        />
      </div>

      {/* Clean Proposals List */}
      <div className="p-4">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterCounts.all === 0 ? 'No Active Proposals' : 'No Matching Proposals'}
            </h3>
            <p className="text-gray-600">
              {filterCounts.all === 0 
                ? 'All substrate changes have been reviewed.'
                : `No proposals match the "${statusFilter}" filter.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onReview={openProposalDetail}
                onQuickApprove={handleQuickApprove}
              />
            ))}
          </div>
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