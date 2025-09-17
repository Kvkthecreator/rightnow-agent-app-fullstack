/**
 * Canon-Compliant Governance Client
 * 
 * User-focused change management:
 * - Clear language about what's changing in their knowledge
 * - Trust-based filtering (not technical thresholds)
 * - Meaningful categories based on user action needed
 * - Visual cues that guide decision urgency
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
  origin: 'agent' | 'human';
  status: string;
  ops_summary: string;
  ops?: Array<{ type: string; data: any }>;
  validator_report: {
    confidence: number;
    warnings: Array<string | { severity: 'critical' | 'warning' | 'info'; message: string }>;
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs-review' | 'ready' | 'additions'>('all');
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

  // Filter proposals by user action needed
  const getFilteredProposals = () => {
    const activeProposals = proposals.filter(p => p.status === 'PROPOSED');
    
    if (statusFilter === 'all') return activeProposals;
    
    return activeProposals.filter(proposal => {
      const confidence = proposal.validator_report.confidence;
      const warnings = proposal.validator_report.warnings || [];
      const hasIssues = warnings.some(w => {
        if (typeof w === 'string') {
          return w.includes('CRITICAL') || w.includes('CONFLICT');
        }
        return w.severity === 'critical';
      });
      
      // Check if it's primarily adding new content
      const ops = Array.isArray(proposal.ops) ? proposal.ops : [];
      const isMainlyAdditions = ops.length > 0 && 
        ops.filter(op => op.type.includes('Create')).length > ops.length * 0.6;

      switch (statusFilter) {
        case 'needs-review':
          return hasIssues || confidence < 0.7;
        case 'ready':
          return confidence > 0.7 && !hasIssues;
        case 'additions':
          return isMainlyAdditions;
        default:
          return true;
      }
    });
  };

  const getFilterCounts = () => {
    const activeProposals = proposals.filter(p => p.status === 'PROPOSED');
    
    const counts = {
      all: activeProposals.length,
      'needs-review': 0,
      ready: 0,
      additions: 0
    };

    activeProposals.forEach(proposal => {
      const confidence = proposal.validator_report.confidence;
      const warnings = proposal.validator_report.warnings || [];
      const hasIssues = warnings.some(w => {
        if (typeof w === 'string') {
          return w.includes('CRITICAL') || w.includes('CONFLICT');
        }
        return w.severity === 'critical';
      });
      
      const ops = Array.isArray(proposal.ops) ? proposal.ops : [];
      const isMainlyAdditions = ops.length > 0 && 
        ops.filter(op => op.type.includes('Create')).length > ops.length * 0.6;

      if (hasIssues || confidence < 0.7) {
        counts['needs-review']++;
      }
      if (confidence > 0.7 && !hasIssues) {
        counts.ready++;
      }
      if (isMainlyAdditions) {
        counts.additions++;
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
      <span className="text-sm font-medium text-gray-700">Show:</span>
      <div className="flex gap-1">
        {[
          { key: 'all', label: 'All changes', count: filterCounts.all, color: 'gray' },
          { key: 'needs-review', label: 'Needs review', count: filterCounts['needs-review'], color: 'yellow' },
          { key: 'ready', label: 'Ready to accept', count: filterCounts.ready, color: 'green' },
          { key: 'additions', label: 'New content', count: filterCounts.additions, color: 'blue' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key as any)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              statusFilter === filter.key
                ? filter.key === 'needs-review' ? 'bg-yellow-100 text-yellow-800 font-medium' :
                  filter.key === 'ready' ? 'bg-green-100 text-green-800 font-medium' :
                  filter.key === 'additions' ? 'bg-blue-100 text-blue-800 font-medium' :
                  'bg-gray-100 text-gray-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-1.5 text-xs ${
                statusFilter === filter.key ? 
                  filter.key === 'needs-review' ? 'text-yellow-700' :
                  filter.key === 'ready' ? 'text-green-700' :
                  filter.key === 'additions' ? 'text-blue-700' :
                  'text-gray-700'
                : 'text-gray-500'
              }`}>
                ({filter.count})
              </span>
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
          title="Suggested Changes" 
          basketId={basketId}
          description="Review AI and manual updates to your knowledge base"
          rightContent={filterComponent}
        />
      </div>

      {/* Clean Proposals List */}
      <div className="p-4">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterCounts.all === 0 ? 'No pending changes' : 'No matching changes'}
            </h3>
            <p className="text-gray-600">
              {filterCounts.all === 0 
                ? 'All suggested changes have been reviewed.'
                : `No changes match "${statusFilter.replace('-', ' ')}" filter.`
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
