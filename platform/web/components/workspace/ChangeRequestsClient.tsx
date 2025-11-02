"use client";

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { cn } from '@/lib/utils';
import type {
  AssignmentChangeRequest,
  ProposalChangeRequest,
  WorkspaceChangeRequestsPayload,
} from '@/lib/workspaces/changeRequests';

type ScopeFilterKey = 'all' | 'assignment' | 'basket' | 'cross-basket' | 'workspace';
type StatusFilterKey = 'pending' | 'all' | 'approved' | 'rejected' | 'closed';

interface BasketOption {
  id: string;
  name: string | null;
}

interface Props {
  requests: WorkspaceChangeRequestsPayload;
  baskets: BasketOption[];
}

interface RequestListItem {
  kind: 'assignment' | 'proposal';
  createdAt: string | null;
  assignment?: AssignmentChangeRequest;
  proposal?: ProposalChangeRequest;
}

const SCOPE_FILTER_LABELS: Record<ScopeFilterKey, string> = {
  all: 'All',
  assignment: 'Assignments',
  basket: 'Basket updates',
  'cross-basket': 'Cross-basket',
  workspace: 'Workspace changes',
};

const STATUS_FILTERS: Array<{ key: StatusFilterKey; label: string }> = [
  { key: 'pending', label: 'Needs review' },
  { key: 'all', label: 'All statuses' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'closed', label: 'Closed' },
];

const SCOPE_LABEL: Record<ProposalChangeRequest['scope'], string> = {
  basket: 'Basket update',
  'cross-basket': 'Cross-basket link',
  workspace: 'Workspace change',
};

export default function WorkspaceChangeRequestsClient({ requests, baskets }: Props) {
  const [assignments, setAssignments] = useState<AssignmentChangeRequest[]>(requests.assignments);
  const [proposals, setProposals] = useState<ProposalChangeRequest[]>(requests.proposals);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('pending');
  const [isPending, startTransition] = useTransition();
  const [proposalActionId, setProposalActionId] = useState<string | null>(null);

  const basketMap = useMemo(() => new Map(baskets.map((basket) => [basket.id, basket.name || 'Untitled basket'])), [baskets]);

  const scopeCounts = useMemo(() => {
    const basketCount = proposals.filter((proposal) => proposal.scope === 'basket').length;
    const crossBasketCount = proposals.filter((proposal) => proposal.scope === 'cross-basket').length;
    const workspaceCount = proposals.filter((proposal) => proposal.scope === 'workspace').length;
    return {
      all: assignments.length + proposals.length,
      assignment: assignments.length,
      basket: basketCount,
      'cross-basket': crossBasketCount,
      workspace: workspaceCount,
    } satisfies Record<ScopeFilterKey, number>;
  }, [assignments.length, proposals]);

  const statusCounts = useMemo(() => {
    const pending = proposals.filter((proposal) => isPendingStatus(proposal.status)).length + assignments.length;
    const approved = proposals.filter((proposal) => isApprovedStatus(proposal.status)).length;
    const rejected = proposals.filter((proposal) => isRejectedStatus(proposal.status)).length;
    const closed = proposals.filter((proposal) => isClosedStatus(proposal.status)).length;
    return {
      pending,
      all: proposals.length + assignments.length,
      approved,
      rejected,
      closed,
    } satisfies Record<StatusFilterKey, number>;
  }, [assignments.length, proposals]);

  const items = useMemo(() => {
    const combined: RequestListItem[] = [
      ...assignments.map((assignment) => ({
        kind: 'assignment' as const,
        createdAt: assignment.createdAt,
        assignment,
      })),
      ...proposals.map((proposal) => ({
        kind: 'proposal' as const,
        createdAt: proposal.createdAt,
        proposal,
      })),
    ];

    const filtered = combined.filter((item) => {
      if (item.kind === 'assignment') {
        return (
          (scopeFilter === 'all' || scopeFilter === 'assignment') &&
          (statusFilter === 'pending' || statusFilter === 'all')
        );
      }

      if (!item.proposal) {
        return false;
      }

      return (
        matchesScopeFilter(item.proposal.scope, scopeFilter) &&
        matchesStatusFilter(item.proposal.status, statusFilter)
      );
    });

    return filtered.sort((a, b) => {
      const tsA = toTimestamp(a.createdAt);
      const tsB = toTimestamp(b.createdAt);
      return tsB - tsA;
    });
  }, [assignments, proposals, scopeFilter, statusFilter]);

  const handleAssign = (id: string, basketId: string) => {
    if (!basketId) return;
    startTransition(async () => {
      const res = await fetchWithToken(`/api/memory/unassigned/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'assigned', assigned_basket_id: basketId }),
      });

      if (!res.ok) {
        console.error('Failed to assign capture', await safeError(res));
        return;
      }
      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      const res = await fetchWithToken(`/api/memory/unassigned/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });

      if (!res.ok) {
        console.error('Failed to dismiss capture', await safeError(res));
        return;
      }

      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
    });
  };

  const approveProposal = async (proposal: ProposalChangeRequest) => {
    setProposalActionId(proposal.id);
    try {
      const res = await fetchWithToken(`/api/proposals/${proposal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: 'Approved via workspace change requests' }),
      });

      if (!res.ok) {
        console.error('Failed to approve proposal', await safeError(res));
        return;
      }
      setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
    } finally {
      setProposalActionId(null);
    }
  };

  const rejectProposal = async (proposal: ProposalChangeRequest) => {
    const note = typeof window !== 'undefined'
      ? window.prompt('Add a quick note for this rejection (optional):', '')
      : '';

    if (note === null) {
      return;
    }

    const reviewNotes = note.trim() || 'Rejected via workspace change requests';
    setProposalActionId(proposal.id);
    try {
      const res = await fetchWithToken(`/api/proposals/${proposal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: reviewNotes, reason: reviewNotes }),
      });

      if (!res.ok) {
        console.error('Failed to reject proposal', await safeError(res));
        return;
      }
      setProposals((prev) => prev.filter((item) => item.id !== proposal.id));
    } finally {
      setProposalActionId(null);
    }
  };

  const hasRequests = items.length > 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Workspace Change Requests</h1>
        <p className="text-sm text-muted-foreground">
          Capture assignments and basket updates that need a quick review before they update your shared memory.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground">Scope</h2>
            <span className="text-xs text-muted-foreground">Choose which requests to view</span>
          </div>
          <ScopeFilterRow filter={scopeFilter} counts={scopeCounts} onChange={setScopeFilter} />
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground">Status</h2>
            <span className="text-xs text-muted-foreground">Track what&apos;s already handled</span>
          </div>
          <StatusFilterRow filter={statusFilter} counts={statusCounts} onChange={setStatusFilter} />
        </div>
      </section>

      {!hasRequests ? (
        <section className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/40 px-6 py-8 text-sm text-muted-foreground">
          <p>{emptyStateMessage(scopeFilter, statusFilter)}</p>
          <p className="mt-1">Keep working in Claude or ChatGPT—new items will land here when they need your call.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            if (item.kind === 'assignment' && item.assignment) {
              return (
                <AssignmentCard
                  key={`assignment-${item.assignment.id}`}
                  assignment={item.assignment}
                  baskets={baskets}
                  isPending={isPending}
                  onAssign={handleAssign}
                  onDismiss={handleDismiss}
                />
              );
            }
            if (item.kind === 'proposal' && item.proposal) {
              return (
                <ProposalCard
                  key={`proposal-${item.proposal.id}`}
                  proposal={item.proposal}
                  basketMap={basketMap}
                  disabled={proposalActionId === item.proposal.id}
                  onApprove={() => approveProposal(item.proposal!)}
                  onReject={() => rejectProposal(item.proposal!)}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      <footer className="text-sm text-muted-foreground">
        Need to adjust governance or anchors?{' '}
        <Link href="/dashboard/settings" className="underline">
          Manage integrations
        </Link>
        .
      </footer>
    </div>
  );
}

function AssignmentCard({
  assignment,
  baskets,
  isPending,
  onAssign,
  onDismiss,
}: {
  assignment: AssignmentChangeRequest;
  baskets: BasketOption[];
  isPending: boolean;
  onAssign: (id: string, basketId: string) => void;
  onDismiss: (id: string) => void;
}) {
  const suggested = Array.isArray(assignment.candidates) ? assignment.candidates.slice(0, 3) : [];

  return (
    <div className="rounded-2xl border border-border bg-white/95 px-5 py-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700">
              Capture assignment
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wide">
              {assignment.tool}
            </span>
            {assignment.sourceHost && (
              <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                {assignment.sourceHost}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(assignment.createdAt)}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{assignment.summary ?? deriveCaptureSummary(assignment)}</p>
          {suggested.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Suggested baskets:{' '}
              {suggested
                .map((candidate, idx) => {
                  const label = candidate.name || candidate.id || `Option ${idx + 1}`;
                  const score = typeof candidate.score === 'number' ? ` (${candidate.score.toFixed(2)})` : '';
                  return `${label}${score}`;
                })
                .join(', ')}
            </p>
          )}
          {assignment.payload && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">Show capture details</summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(assignment.payload, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AssignControl
          baskets={baskets}
          disabled={isPending}
          onAssign={(basketId) => onAssign(assignment.id, basketId)}
        />
        <button
          type="button"
          onClick={() => onDismiss(assignment.id)}
          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          disabled={isPending}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  basketMap,
  disabled,
  onApprove,
  onReject,
}: {
  proposal: ProposalChangeRequest;
  basketMap: Map<string, string>;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const validator = extractValidatorReport(proposal.validatorReport);
  const confidence = typeof validator.confidence === 'number' ? validator.confidence : null;
  const warnings = Array.isArray(validator.warnings) ? validator.warnings.length : 0;
  const confidenceLabel = confidence !== null ? `${Math.round(confidence * 100)}% confidence` : null;
  const summary =
    (typeof validator.impact_summary === 'string' && validator.impact_summary) ||
    (typeof validator.ops_summary === 'string' && validator.ops_summary) ||
    humanizeProposalKind(proposal.proposalKind);
  const operationsNarrative = describeOperations(proposal.ops);
  const scopeLabel = SCOPE_LABEL[proposal.scope];
  const targetLabel = deriveTargetLabel(proposal, basketMap);
  const statusInfo = getStatusStyles(proposal.status);

  const detailHref =
    proposal.scope === 'basket' && proposal.basketId
      ? `/baskets/${proposal.basketId}/change-requests#${proposal.id}`
      : null;

  return (
    <div className="rounded-2xl border border-border bg-white/95 px-5 py-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusInfo.className}>
              {statusInfo.label}
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {scopeLabel}
            </span>
            {targetLabel && (
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {targetLabel}
              </span>
            )}
            {proposal.autoApproved && (
              <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-xs font-medium text-fuchsia-700">
                Auto-approved
              </span>
            )}
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {proposal.origin === 'agent' ? 'Agent generated' : 'Manual'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(proposal.createdAt)}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{summary}</p>
          <p className="text-xs text-muted-foreground">{operationsNarrative}</p>
          {confidenceLabel && (
            <p className="text-xs text-muted-foreground">
              {confidenceLabel}
              {warnings > 0 ? ` • ${warnings} validator warning${warnings === 1 ? '' : 's'}` : ''}
            </p>
          )}
        </div>
        {detailHref && (
          <Link
            href={detailHref}
            className="text-xs font-medium text-primary hover:underline"
          >
            Open in basket view
          </Link>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onApprove}
          className={cn(
            'rounded-md bg-primary px-3 py-1 font-medium text-white transition',
            disabled ? 'opacity-50' : 'opacity-100',
          )}
          disabled={disabled}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-md border border-border px-3 py-1 font-medium text-muted-foreground hover:bg-muted"
          disabled={disabled}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function ScopeFilterRow({
  filter,
  counts,
  onChange,
}: {
  filter: ScopeFilterKey;
  counts: Record<ScopeFilterKey, number>;
  onChange: (value: ScopeFilterKey) => void;
}) {
  const filters = (Object.keys(SCOPE_FILTER_LABELS) as ScopeFilterKey[]).map((key) => ({
    key,
    label: `${SCOPE_FILTER_LABELS[key]} (${counts[key]})`,
  }));

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition',
            filter === key
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function StatusFilterRow({
  filter,
  counts,
  onChange,
}: {
  filter: StatusFilterKey;
  counts: Record<StatusFilterKey, number>;
  onChange: (value: StatusFilterKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition',
            filter === key
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          {`${label} (${counts[key] ?? 0})`}
        </button>
      ))}
    </div>
  );
}

function AssignControl({
  baskets,
  onAssign,
  disabled,
}: {
  baskets: BasketOption[];
  onAssign: (basketId: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1"
        disabled={disabled}
      >
        <option value="">Assign to…</option>
        {baskets.map((basket) => (
          <option key={basket.id} value={basket.id}>
            {basket.name || 'Untitled'}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={cn(
          'rounded-md bg-primary px-3 py-1 text-white transition',
          selected ? 'opacity-100' : 'cursor-not-allowed opacity-50',
        )}
        onClick={() => selected && onAssign(selected)}
        disabled={disabled || !selected}
      >
        Assign
      </button>
    </div>
  );
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'just now';
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return 'just now';
  }
}

function deriveCaptureSummary(assignment: AssignmentChangeRequest) {
  const content = assignment.payload && typeof assignment.payload === 'object'
    ? (assignment.payload as Record<string, unknown>).content
    : null;
  if (typeof content === 'string' && content.length > 0) {
    return content.length > 160 ? `${content.slice(0, 160)}…` : content;
  }
  return 'Capture pending review';
}

const PENDING_STATUSES = new Set<ProposalChangeRequest['status']>(['PROPOSED', 'UNDER_REVIEW']);
const APPROVED_STATUSES = new Set<ProposalChangeRequest['status']>(['APPROVED', 'EXECUTED']);
const REJECTED_STATUSES = new Set<ProposalChangeRequest['status']>(['REJECTED']);
const CLOSED_STATUSES = new Set<ProposalChangeRequest['status']>(['SUPERSEDED', 'MERGED']);

function matchesScopeFilter(scope: ProposalChangeRequest['scope'], filter: ScopeFilterKey) {
  if (filter === 'all') return true;
  if (filter === 'assignment') return false;
  return scope === filter;
}

function matchesStatusFilter(status: ProposalChangeRequest['status'], filter: StatusFilterKey) {
  switch (filter) {
    case 'pending':
      return isPendingStatus(status);
    case 'approved':
      return isApprovedStatus(status);
    case 'rejected':
      return isRejectedStatus(status);
    case 'closed':
      return isClosedStatus(status);
    default:
      return true;
  }
}

function isPendingStatus(status: ProposalChangeRequest['status']) {
  return PENDING_STATUSES.has(status);
}

function isApprovedStatus(status: ProposalChangeRequest['status']) {
  return APPROVED_STATUSES.has(status);
}

function isRejectedStatus(status: ProposalChangeRequest['status']) {
  return REJECTED_STATUSES.has(status);
}

function isClosedStatus(status: ProposalChangeRequest['status']) {
  return CLOSED_STATUSES.has(status);
}

function getStatusStyles(status: ProposalChangeRequest['status']) {
  if (isPendingStatus(status)) {
    return {
      label: 'Pending review',
      className: 'rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700',
    };
  }
  if (isApprovedStatus(status)) {
    return {
      label: 'Approved',
      className: 'rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700',
    };
  }
  if (isRejectedStatus(status)) {
    return {
      label: 'Rejected',
      className: 'rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700',
    };
  }
  if (isClosedStatus(status)) {
    return {
      label: 'Closed',
      className: 'rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700',
    };
  }
  return {
    label: formatStatusLabel(status),
    className: 'rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground',
  };
}

function describeOperations(ops: ProposalChangeRequest['ops']): string {
  if (!Array.isArray(ops) || ops.length === 0) {
    return 'No substrate operations listed.';
  }

  const counts = ops.reduce<Record<string, number>>((acc, op) => {
    const key = op.type || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const friendly: Record<string, string> = {
    CreateBlock: 'add block',
    ReviseBlock: 'update block',
    ArchiveBlock: 'archive block',
    CreateContextItem: 'add context item',
    MergeContextItems: 'merge context item',
    PromoteScope: 'promote scope',
    RedactDump: 'redact capture',
    AssignDumpToBasket: 'assign capture',
  };

  const segments = Object.entries(counts).map(([type, count]) => {
    const label = friendly[type] || type.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `${count} ${count === 1 ? label : `${label}s`}`;
  });

  if (segments.length === 1) return `Proposes to ${segments[0]}.`;
  if (segments.length === 2) return `Proposes to ${segments[0]} and ${segments[1]}.`;
  const last = segments.pop();
  return `Proposes to ${segments.join(', ')}, and ${last}.`;
}

function deriveTargetLabel(proposal: ProposalChangeRequest, basketMap: Map<string, string>) {
  const names = new Set<string>();
  if (proposal.basketId) {
    names.add(basketMap.get(proposal.basketId) || 'Unknown basket');
  }
  if (proposal.targetBasketId) {
    names.add(basketMap.get(proposal.targetBasketId) || 'Unknown basket');
  }
  proposal.affectedBasketIds.forEach((id) => {
    names.add(basketMap.get(id) || 'Unknown basket');
  });

  if (names.size === 0) return null;
  return [...names].join(' • ');
}

function humanizeProposalKind(kind: string) {
  if (!kind) return 'Proposal awaiting review';
  return kind
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractValidatorReport(report: Record<string, unknown> | null): {
  confidence?: number;
  impact_summary?: string;
  ops_summary?: string;
  warnings?: unknown[];
} {
  if (!report || typeof report !== 'object') return {};
  return report as {
    confidence?: number;
    impact_summary?: string;
    ops_summary?: string;
    warnings?: unknown[];
  };
}

async function safeError(res: Response) {
  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

function toTimestamp(value: string | null) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function emptyStateMessage(filter: ScopeFilterKey, statusFilter: StatusFilterKey) {
  if (statusFilter === 'approved') {
    return 'No approved proposals to review yet.';
  }
  if (statusFilter === 'rejected') {
    return 'No rejected proposals on record.';
  }
  if (statusFilter === 'closed') {
    return 'No closed proposals here—everything is still in motion.';
  }

  switch (filter) {
    case 'assignment':
      return 'No capture assignments need attention right now.';
    case 'basket':
      return 'No basket-level proposals are waiting for you.';
    case 'cross-basket':
      return 'No cross-basket changes are queued.';
    case 'workspace':
      return 'The workspace is clear—no global changes pending.';
    default:
      return 'You’re all caught up on workspace change requests.';
  }
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
