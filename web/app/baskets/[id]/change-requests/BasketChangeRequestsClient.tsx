"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Filter,
  FileText,
  Lightbulb,
  Search,
  ShieldAlert,
  User,
} from 'lucide-react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProposalDetailModal } from '@/components/governance/ProposalDetailModal';

interface ProposalOperation {
  type: string;
  data: Record<string, unknown>;
}

interface Proposal {
  id: string;
  proposal_kind: string;
  origin: 'agent' | 'human';
  source_host?: string | null;
  source_session?: string | null;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  ops_summary: string;
  confidence: number;
  impact_summary: string;
  created_at: string;
  reviewed_at: string | null;
  executed_at: string | null;
  auto_approved: boolean;
  review_notes: string;
  is_executed: boolean;
  ops: ProposalOperation[];
  provenance: string[];
  validator_report: {
    confidence: number;
    warnings: string[];
    suggested_merges: string[];
    ontology_hits: string[];
    impact_summary?: string;
  };
}

interface ProposalsResponse {
  items: Proposal[];
}

const fetcher = (url: string) =>
  fetchWithToken(url).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to load change requests');
    }
    return res.json();
  });

type StatusFilter = 'all' | 'PROPOSED' | 'APPROVED' | 'REJECTED';

const STATUS_CONTROLS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'PROPOSED', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

interface BasketChangeRequestsClientProps {
  basketId: string;
}

export default function BasketChangeRequestsClient({ basketId }: BasketChangeRequestsClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAutoOnly, setShowAutoOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [insightLoadingId, setInsightLoadingId] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<ProposalsResponse>(
    `/api/baskets/${basketId}/proposals${statusFilter === 'all' ? '' : `?status=${statusFilter}`}`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const proposals = data?.items ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const openFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setSelectedProposalId(null);
        return;
      }
      const match = proposals.find((proposal) => proposal.id === hash);
      if (match) {
        setSelectedProposalId(match.id);
      }
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const text = query.trim().toLowerCase();
    return proposals
      .filter((proposal) => (showAutoOnly ? proposal.auto_approved : true))
      .filter((proposal) => {
        if (!text) return true;
        return (
          proposal.ops_summary.toLowerCase().includes(text) ||
          proposal.impact_summary.toLowerCase().includes(text) ||
          proposal.proposal_kind.toLowerCase().includes(text)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [proposals, query, showAutoOnly]);

  const stats = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === 'PROPOSED').length;
    const approved = proposals.filter((p) => p.status === 'APPROVED').length;
    const rejected = proposals.filter((p) => p.status === 'REJECTED').length;
    const autoApproved = proposals.filter((p) => p.auto_approved).length;
    const highImpact = proposals.filter((p) => p.validator_report.warnings.length > 0 || p.validator_report.confidence < 0.6).length;

    return { total, pending, approved, rejected, autoApproved, highImpact };
  }, [proposals]);

  const handleInsights = async (proposalId: string) => {
    setInsightLoadingId(proposalId);
    setInsightError(null);
    try {
      const response = await fetch('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          scope: 'proposal',
          proposal_id: proposalId,
          force_refresh: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || payload?.detail || 'Failed to request insights');
      }

      window.dispatchEvent(new CustomEvent('reflections:refresh'));
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Failed to trigger proposal insights');
    } finally {
      setInsightLoadingId(null);
    }
  };

  const openProposalDetail = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = proposalId;
      window.history.replaceState(null, '', url.toString());
    }
  };

  const closeProposalDetail = () => {
    setSelectedProposalId(null);
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
        body: JSON.stringify({ review_notes: notes || 'Approved via governance queue' }),
      });
      if (!response.ok) {
        throw new Error(`Approve failed: ${response.status}`);
      }
      mutate();
    } catch (err) {
      console.error('Failed to approve proposal', err);
    }
  };

  const handleReject = async (proposalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: 'Rejected via governance queue', reason }),
      });
      if (!response.ok) {
        throw new Error(`Reject failed: ${response.status}`);
      }
      mutate();
    } catch (err) {
      console.error('Failed to reject proposal', err);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-lg font-semibold text-red-700">Unable to load change requests</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
          <Button onClick={() => mutate()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total proposals"
          value={stats.total}
          icon={<FileText className="h-5 w-5 text-slate-500" />}
          onClick={() => setStatusFilter('all')}
          active={statusFilter === 'all'}
        />
        <StatCard
          title="Pending review"
          value={stats.pending}
          tone="warning"
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          onClick={() => setStatusFilter('PROPOSED')}
          active={statusFilter === 'PROPOSED'}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          tone="success"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          onClick={() => setStatusFilter('APPROVED')}
          active={statusFilter === 'APPROVED'}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          tone="danger"
          icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
          onClick={() => setStatusFilter('REJECTED')}
          active={statusFilter === 'REJECTED'}
        />
        <StatCard
          title="Auto-approved"
          value={stats.autoApproved}
          tone="accent"
          icon={<Bot className="h-5 w-5 text-purple-500" />}
          active={showAutoOnly}
          onClick={() => {
            setShowAutoOnly((prev) => !prev);
            setStatusFilter('all');
          }}
        />
        <StatCard
          title="Needs attention"
          value={stats.highImpact}
          tone="alert"
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          onClick={() => {
            setStatusFilter('PROPOSED');
            setShowAutoOnly(false);
          }}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_CONTROLS.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={statusFilter === key ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={showAutoOnly ? 'primary' : 'outline'}
              onClick={() => setShowAutoOnly((prev) => !prev)}
              className="flex items-center gap-1"
            >
              <Filter className="h-3.5 w-3.5" />
              Auto-approved
            </Button>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search proposals"
              className="pl-9"
            />
          </div>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-base font-medium text-slate-700">No change requests found</p>
            <p className="max-w-sm text-sm text-slate-500">
              Adjust your filters or capture new memory to generate substrate proposals.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onReview={() => openProposalDetail(proposal.id)}
                onInsights={() => handleInsights(proposal.id)}
                loadingInsights={insightLoadingId === proposal.id}
              />
            ))}
          </div>
        )}
      </section>

      {insightError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {insightError}
        </div>
      )}

      <ProposalDetailModal
        basketId={basketId}
        isOpen={Boolean(selectedProposalId)}
        proposalId={selectedProposalId}
        onClose={closeProposalDetail}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'accent' | 'alert';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ title, value, icon, tone, onClick, active }: StatCardProps) {
  const palette = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    accent: 'border-purple-200 bg-purple-50 text-purple-800',
    alert: 'border-orange-200 bg-orange-50 text-orange-800',
  } as const;

  const toneClasses = tone ? palette[tone] : 'border-slate-200 bg-white text-slate-800';

  const interactionClass = onClick ? 'cursor-pointer' : '';

  return (
    <Card
      onClick={onClick}
      className={`group border-2 transition-all duration-200 ${interactionClass} ${toneClasses} ${
        active ? 'shadow-lg ring-2 ring-offset-2 ring-slate-300' : 'hover:shadow-md'
      }`}
    >
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-full border border-dashed border-current/30 p-3 text-current">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  onReview: () => void;
  onInsights: () => void;
  loadingInsights: boolean;
}

function ProposalCard({ proposal, onReview, onInsights, loadingInsights }: ProposalCardProps) {
  const statusTone = proposal.status === 'APPROVED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : proposal.status === 'PROPOSED'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  const originBadge = proposal.origin === 'agent'
    ? { label: proposal.source_host || 'Ambient agent', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Bot className="h-3.5 w-3.5" /> }
    : { label: 'Human initiated', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <User className="h-3.5 w-3.5" /> };

  const operationSummary = (() => {
    const counts = proposal.ops.reduce<Record<string, number>>((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {});

    const parts = [];
    if (counts.CreateBlock) parts.push(`${counts.CreateBlock} block${counts.CreateBlock === 1 ? '' : 's'}`);
    if (counts.CreateContextItem) parts.push(`${counts.CreateContextItem} context item${counts.CreateContextItem === 1 ? '' : 's'}`);
    if (counts.ReviseBlock) parts.push(`${counts.ReviseBlock} revision${counts.ReviseBlock === 1 ? '' : 's'}`);
    if (parts.length === 0) parts.push(`${proposal.ops.length} operation${proposal.ops.length === 1 ? '' : 's'}`);
    return parts.join(' • ');
  })();

  const submittedAt = new Date(proposal.created_at).toLocaleString();

  return (
    <Card className="border-slate-200 shadow-sm transition-colors hover:border-slate-300">
      <CardHeader className="gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusTone}>
            {proposal.status}
          </Badge>
          <Badge variant="outline">{proposal.proposal_kind}</Badge>
          {proposal.auto_approved && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Auto
            </Badge>
          )}
          <Badge variant="outline" className={`${originBadge.className} flex items-center gap-1`}> 
            {originBadge.icon}
            {originBadge.label}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900">
          {proposal.ops_summary}
        </CardTitle>
        <p className="text-sm text-slate-600">{proposal.impact_summary}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Database className="h-4 w-4 text-slate-400" />
            {operationSummary}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-slate-400" />
            Submitted {submittedAt}
          </span>
          <span className="flex items-center gap-1">
            Confidence
            <Badge variant="outline" className="border-slate-200 text-slate-700">
              {Math.round((proposal.validator_report.confidence ?? proposal.confidence) * 100)}%
            </Badge>
          </span>
          {proposal.validator_report.warnings.length > 0 && (
            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
              {proposal.validator_report.warnings.length} warning{proposal.validator_report.warnings.length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {proposal.provenance.length > 0 ? `${proposal.provenance.length} referenced capture${proposal.provenance.length === 1 ? '' : 's'}` : 'No capture references'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onInsights}
              disabled={loadingInsights}
              className="text-amber-600 hover:text-amber-700"
            >
              <Lightbulb className="h-4 w-4" />
              {loadingInsights ? 'Analyzing…' : 'Analyze' }
            </Button>
            <Button variant="primary" size="sm" onClick={onReview} className="flex items-center gap-1">
              Review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
