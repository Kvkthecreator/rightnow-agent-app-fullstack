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

  const pendingProposals = proposals.filter(p => p.status === 'PROPOSED');
  const autoApprovedProposals = proposals.filter(p => p.auto_approved);
  const executedProposals = proposals.filter(p => (p.status === 'EXECUTED' || p.status === 'APPROVED') && !p.auto_approved);
  const rejectedProposals = proposals.filter(p => p.status === 'REJECTED');

  const sections = [
    {
      key: 'pending',
      title: 'Pending Review',
      description: 'Proposals waiting on a human decision.',
      items: pendingProposals,
      allowQuickApprove: true,
      emptyMessage: 'No proposals need review right now.',
    },
    {
      key: 'auto-approved',
      title: 'Auto-Approved',
      description: 'Governance auto-approved these high-confidence changes.',
      items: autoApprovedProposals,
      emptyMessage: 'No auto-approved proposals yet.',
    },
    {
      key: 'executed',
      title: 'Executed Changes',
      description: 'Recently approved proposals already committed to the substrate.',
      items: executedProposals,
      emptyMessage: 'No executed proposals yet.',
    },
    {
      key: 'rejected',
      title: 'Rejected',
      description: 'Proposals that were reviewed but not accepted.',
      items: rejectedProposals,
      emptyMessage: 'No rejected proposals.',
    },
  ];

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

  return (
    <div className="space-y-6">
      <div className="border-b p-4">
        <SubpageHeader 
          title="Suggested Changes" 
          basketId={basketId}
          description="Review AI and manual updates to your knowledge base"
        />
      </div>

      <div className="px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryStat label="Pending" value={pendingProposals.length} accent="bg-blue-100 text-blue-700" />
          <SummaryStat label="Auto-approved" value={autoApprovedProposals.length} accent="bg-green-100 text-green-700" />
          <SummaryStat label="Executed" value={executedProposals.length} accent="bg-indigo-100 text-indigo-700" />
          <SummaryStat label="Rejected" value={rejectedProposals.length} accent="bg-red-100 text-red-700" />
        </div>

        <div className="space-y-8">
          {sections.map(section => (
            <section key={section.key} className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                  {section.emptyMessage}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.items.map((proposalItem) => (
                    <ProposalCard
                      key={proposalItem.id}
                      proposal={proposalItem}
                      onReview={openProposalDetail}
                      onQuickApprove={section.allowQuickApprove ? handleQuickApprove : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
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

function SummaryStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 ${value === 0 ? 'opacity-75' : ''}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
