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

type FilterKey = 'all' | 'assignment' | 'basket' | 'cross-basket' | 'workspace';

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

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  assignment: 'Assignments',
  basket: 'Basket updates',
  'cross-basket': 'Cross-basket',
  workspace: 'Workspace changes',
};

const SCOPE_LABEL: Record<ProposalChangeRequest['scope'], string> = {
  basket: 'Basket update',
  'cross-basket': 'Cross-basket link',
  workspace: 'Workspace change',
};

export default function WorkspaceChangeRequestsClient({ requests, baskets }: Props) {
  const [assignments, setAssignments] = useState<AssignmentChangeRequest[]>(requests.assignments);
  const [proposals, setProposals] = useState<ProposalChangeRequest[]>(requests.proposals);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [isPending, startTransition] = useTransition();
  const [proposalActionId, setProposalActionId] = useState<string | null>(null);

  const basketMap = useMemo(() => new Map(baskets.map((basket) => [basket.id, basket.name || 'Untitled basket'])), [baskets]);

  const counts = useMemo(() => {
    const basketCount = proposals.filter((proposal) => proposal.scope === 'basket').length;
    const crossBasketCount = proposals.filter((proposal) => proposal.scope === 'cross-basket').length;
    const workspaceCount = proposals.filter((proposal) => proposal.scope === 'workspace').length;
    return {
      all: assignments.length + proposals.length,
      assignment: assignments.length,
      basket: basketCount,
      'cross-basket': crossBasketCount,
      workspace: workspaceCount,
    } satisfies Record<FilterKey, number>;
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
      if (filter === 'all') return true;
      if (filter === 'assignment') return item.kind === 'assignment';
      if (item.kind !== 'proposal' || !item.proposal) return false;
      return item.proposal.scope === filter;
    });

    return filtered.sort((a, b) => {
      const tsA = toTimestamp(a.createdAt);
      const tsB = toTimestamp(b.createdAt);
      return tsB - tsA;
    });
  }, [assignments, proposals, filter]);

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
    <div className="mx-auto max-w-4xl space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Workspace Change Requests</h1>
        <p className="text-sm text-muted-foreground">
          Capture assignments and basket updates that need a quick review before they update your shared memory.
        </p>
      </header>

      <FilterRow filter={filter} counts={counts} onChange={setFilter} />

      {!hasRequests ? (
        <section className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <p>{emptyStateMessage(filter)}</p>
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
    <div className="rounded-lg border border-border bg-card px-4 py-4 text-sm shadow-sm">
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

  const detailHref =
    proposal.scope === 'basket' && proposal.basketId
      ? `/baskets/${proposal.basketId}/change-requests#${proposal.id}`
      : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {scopeLabel}
            </span>
            {targetLabel && (
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {targetLabel}
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

function FilterRow({
  filter,
  counts,
  onChange,
}: {
  filter: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (value: FilterKey) => void;
}) {
  const filters = (Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => ({
    key,
    label: `${FILTER_LABELS[key]} (${counts[key]})`,
  }));

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition',
            filter === key ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
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

function emptyStateMessage(filter: FilterKey) {
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
