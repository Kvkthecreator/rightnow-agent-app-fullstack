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
import { CheckCircle, Clock, XCircle, FileText, Database, User, Bot, ChevronRight, Filter, Eye, Lightbulb } from "lucide-react";

interface Proposal {
  id: string;
  proposal_kind: string;
  origin: string;
  source_host?: string;
  source_session?: string;
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

interface BasketChangeRequestsClientProps {
  basketId: string;
}

export default function BasketChangeRequestsClient({ basketId }: BasketChangeRequestsClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PROPOSED' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [insightLoadingId, setInsightLoadingId] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [hashProcessed, setHashProcessed] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const processHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        if (isDetailModalOpen) {
          setSelectedProposalId(null);
          setIsDetailModalOpen(false);
        }
        return;
      }

      const match = proposals.find((proposal) => proposal.id === hash);
      if (match) {
        setSelectedProposalId(hash);
        setIsDetailModalOpen(true);
      }
    };

    if (!hashProcessed) {
      processHash();
      setHashProcessed(true);
    }

    window.addEventListener('hashchange', processHash);
    return () => window.removeEventListener('hashchange', processHash);
  }, [proposals, hashProcessed, isDetailModalOpen]);

  const openProposalDetail = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setIsDetailModalOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = proposalId;
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleProposalInsights = async (proposalId: string) => {
    setInsightLoadingId(proposalId);
    setInsightError(null);
    try {
      const resp = await fetch('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          scope: 'proposal',
          proposal_id: proposalId,
          force_refresh: true,
        }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(payload?.error || payload?.detail || 'Failed to request insights');
      }
      window.dispatchEvent(new CustomEvent('reflections:refresh'));
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : 'Failed to request insights');
    } finally {
      setInsightLoadingId(null);
    }
  };

  const closeProposalDetail = () => {
    setSelectedProposalId(null);
    setIsDetailModalOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState(null, '', url.pathname + url.search);
    }
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={view === 'summary' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('summary')}
                  className={view === 'summary' ? '' : 'text-gray-600 hover:text-gray-900'}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Summary
                </Button>
                <Button
                  variant={view === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className={view === 'list' ? '' : 'text-gray-600 hover:text-gray-900'}
                >
                  <Filter className="h-3.5 w-3.5" />
                  List
                </Button>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              >
                <option value="all">All Proposals</option>
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
            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-blue-500" 
              onClick={() => setStatusFilter('all')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{governanceStats.total}</div>
                    <div className="text-sm font-medium text-gray-700">Total Proposals</div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-orange-500" 
              onClick={() => setStatusFilter('PROPOSED')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-orange-600 mb-1">{governanceStats.pending}</div>
                    <div className="text-sm font-medium text-gray-700">Pending Review</div>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-green-500" 
              onClick={() => setStatusFilter('APPROVED')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-1">{governanceStats.approved}</div>
                    <div className="text-sm font-medium text-gray-700">Approved</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">{governanceStats.autoApproved}</div>
                    <div className="text-sm font-medium text-gray-700">Auto-Approved</div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Bot className="h-6 w-6 text-purple-600" />
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
              <CardContent className="space-y-2">
                {filteredProposals.slice(0, 5).map((proposal) => {
                  const hostLabel = proposal.source_host || (proposal.origin === 'agent' ? 'ambient' : 'human');
                  return (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-all duration-200 group"
                    onClick={() => openProposalDetail(proposal.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-full ${proposal.origin === 'agent' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {proposal.origin === 'agent' ? 
                          <Bot className="h-4 w-4 text-purple-600" /> : 
                          <User className="h-4 w-4 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{proposal.ops_summary}</div>
                        <div className="text-sm text-gray-600 truncate flex items-center gap-2">
                          <span>{proposal.impact_summary}</span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-indigo-600">{hostLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {proposal.ops.length} operation{proposal.ops.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant="outline"
                        className={
                          proposal.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          proposal.status === 'PROPOSED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {proposal.status}
                      </Badge>
                      {proposal.auto_approved && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          Auto
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
                {filteredProposals.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                    onClick={() => setView('list')}
                  >
                    View All {filteredProposals.length} Proposals
                    <ChevronRight className="h-4 w-4 ml-1" />
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
                        {(proposal.source_host || proposal.origin) && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            {proposal.source_host || (proposal.origin === 'agent' ? 'ambient' : 'human')}
                          </Badge>
                        )}
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
                        onClick={() => handleProposalInsights(proposal.id)}
                        variant="ghost"
                        size="sm"
                        disabled={insightLoadingId === proposal.id}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        {insightLoadingId === proposal.id ? 'Analyzing…' : 'Analyze Insights'}
                      </Button>
                      <Button
                        onClick={() => openProposalDetail(proposal.id)}
                        variant="primary"
                        size="sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
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
      {insightError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {insightError}
        </div>
      )}
    </div>
  );
}
