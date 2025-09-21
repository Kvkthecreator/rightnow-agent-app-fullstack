/* Canon-Compliant Governance Dashboard - Redesigned UX
   Summary cards → detailed proposal view with proper information architecture
   Unified proposals (blocks + context items) with clear auto-approval status
   Modal redesigned from first principles for better rendering and UX
*/
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/clients";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SubpageHeader } from "@/components/basket/SubpageHeader";
import { ProposalDetailModal } from "@/components/governance/ProposalDetailModal";
import { CheckCircle, Clock, XCircle, FileText, Database, User, Bot, ChevronRight, Filter, Eye } from "lucide-react";

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
  auto_approved: boolean;
  reviewed_at: string | null;
  executed_at: string | null;
  review_notes: string;
  is_executed: boolean;
  ops: any[];
}

interface GovernanceClientProps {
  basketId: string;
}

export default function GovernanceClient({ basketId }: GovernanceClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PROPOSED' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [view, setView] = useState<'summary' | 'list'>('summary');

  type StatusFilterType = 'all' | 'PROPOSED' | 'APPROVED' | 'REJECTED';

  useEffect(() => {
    const fetchProposals = async () => {
      if (!basketId) return;
      
      setLoading(true);
      setError(null);

      try {
        const url = `/api/baskets/${basketId}/proposals${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response Error:', response.status, response.statusText, errorText);
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
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

  // Calculate governance statistics
  const governanceStats = {
    total: proposals.length,
    pending: proposals.filter(p => p.status === 'PROPOSED').length,
    approved: proposals.filter(p => p.status === 'APPROVED').length,
    rejected: proposals.filter(p => p.status === 'REJECTED').length,
    autoApproved: proposals.filter(p => p.auto_approved).length,
    recentActivity: proposals.filter(p => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(p.created_at) > dayAgo;
    }).length
  };

  const filteredProposals = proposals.filter(proposal => {
    return statusFilter === 'all' || proposal.status === statusFilter;
  });

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

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="border-b p-4">
        <SubpageHeader 
          title="Governance Dashboard" 
          basketId={basketId}
          description="Unified proposals and canon-compliant review workflow"
          rightContent={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('summary')}
                >
                  Summary View
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  List View
                </Button>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="PROPOSED">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          }
        />
      </div>

      {view === 'summary' ? (
        /* Summary Dashboard View */
        <div className="p-6 space-y-6">
          {/* Governance Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{governanceStats.total}</div>
                    <div className="text-sm text-gray-600">Total Proposals</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('PROPOSED')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{governanceStats.pending}</div>
                    <div className="text-sm text-gray-600">Pending Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('APPROVED')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{governanceStats.approved}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{governanceStats.autoApproved}</div>
                    <div className="text-sm text-gray-600">Auto-Approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {filteredProposals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {statusFilter === 'all' ? 'Recent Proposals' : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Proposals`}
                  <Badge variant="outline">{filteredProposals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredProposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => openProposalDetail(proposal.id)}>
                    <div className="flex items-center gap-3">
                      {proposal.origin === 'agent' ? <Bot className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-blue-600" />}
                      <div>
                        <div className="font-medium text-gray-900">{proposal.ops_summary}</div>
                        <div className="text-sm text-gray-600">{proposal.impact_summary}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={proposal.status === 'APPROVED' ? 'default' : proposal.status === 'PROPOSED' ? 'secondary' : 'outline'}
                        className={
                          proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'PROPOSED' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {proposal.status}
                      </Badge>
                      {proposal.auto_approved && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Auto
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                {filteredProposals.length > 5 && (
                  <Button variant="outline" className="w-full" onClick={() => setView('list')}>
                    View All {filteredProposals.length} Proposals
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {filteredProposals.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' ? 'No governance proposals yet. Add memory to start the review workflow.' :
                   `No proposals with status "${statusFilter}".`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Detailed List View */
        <div className="p-6 space-y-4">
          {filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
                <p className="text-gray-600">No change requests match the current filter.</p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow" data-testid="proposal-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{proposal.proposal_kind}</Badge>
                        <Badge 
                          variant={proposal.status === 'APPROVED' ? 'default' : proposal.status === 'PROPOSED' ? 'secondary' : 'outline'}
                          className={
                            proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            proposal.status === 'PROPOSED' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {proposal.status}
                        </Badge>
                        {proposal.auto_approved && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Auto-Approved
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {proposal.ops.length} operations
                        </Badge>
                        {proposal.origin === 'agent' ? <Bot className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-blue-600" />}
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

                      {proposal.auto_approved && proposal.executed_at && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium text-sm">Auto-executed:</span>
                            <span className="text-green-700 text-sm">
                              {new Date(proposal.executed_at).toLocaleString()}
                            </span>
                          </div>
                          {proposal.review_notes && (
                            <p className="text-green-700 text-sm mt-1">{proposal.review_notes}</p>
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
                        <Eye className="h-4 w-4 mr-1" />
                        Review Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

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