"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  Layers,
  Link2,
  Loader2,
  ShieldOff,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';

interface ProposalOperation {
  type: string;
  data: Record<string, unknown>;
}

interface ProposalDetail {
  id: string;
  proposal_kind: string;
  origin: 'agent' | 'human';
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  auto_approved: boolean;
  created_at: string;
  reviewed_at: string | null;
  executed_at: string | null;
  review_notes: string;
  ops_summary: string;
  operations_preview?: string;
  impact_summary: string;
  provenance: string[];
  ops: ProposalOperation[];
  validator_report: {
    confidence: number;
    warnings: string[];
    suggested_merges: string[];
    ontology_hits: string[];
    impact_summary?: string;
    ops_summary?: string;
  };
}

interface ProposalDetailModalProps {
  basketId: string;
  proposalId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (proposalId: string, notes?: string) => Promise<void>;
  onReject: (proposalId: string, reason: string) => Promise<void>;
}

export function ProposalDetailModal({
  basketId,
  proposalId,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ProposalDetailModalProps) {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !proposalId) {
      setProposal(null);
      setNotes('');
      setActionError(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/baskets/${basketId}/proposals/${proposalId}`);
        if (!response.ok) {
          throw new Error(`Failed to load proposal (${response.status})`);
        }
        const data = await response.json();
        setProposal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load proposal detail');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [basketId, proposalId, isOpen]);

  const groupedOperations = useMemo(() => {
    if (!proposal) return [] as Array<{ type: string; items: ProposalOperation[] }>;
    const map = new Map<string, ProposalOperation[]>();
    proposal.ops.forEach((op) => {
      map.set(op.type, [...(map.get(op.type) ?? []), op]);
    });
    return Array.from(map.entries()).map(([type, items]) => ({ type, items }));
  }, [proposal]);

  const confidencePct = proposal ? Math.round((proposal.validator_report.confidence ?? 0) * 100) : null;

  const handleApprove = async () => {
    if (!proposal) return;
    try {
      setSubmitting(true);
      setActionError(null);
      await onApprove(proposal.id, notes ? notes.trim() : undefined);
      setNotes('');
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    try {
      setSubmitting(true);
      setActionError(null);
      await onReject(proposal.id, notes.trim() || 'Rejected via governance review');
      setNotes('');
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            {proposal?.origin === 'agent' ? <Bot className="h-5 w-5 text-purple-500" /> : <User className="h-5 w-5 text-blue-500" />}
            Governance Review
          </DialogTitle>
          {proposal && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{proposal.proposal_kind}</Badge>
              <Badge
                variant="outline"
                className={
                  proposal.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : proposal.status === 'PROPOSED'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                }
              >
                {proposal.status}
              </Badge>
              {proposal.auto_approved && (
                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                  Auto-approved
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        )}

        {error && (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        {proposal && !loading && !error && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="text-slate-900">{proposal.ops_summary}</p>
                  <p className="mt-1 text-slate-600">{proposal.impact_summary}</p>
                </div>
                {proposal.validator_report.impact_summary && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Validator insight</p>
                    <p className="mt-1 text-sm text-slate-700">{proposal.validator_report.impact_summary}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Submitted {new Date(proposal.created_at).toLocaleString()}</span>
                  {proposal.reviewed_at && <span>Reviewed {new Date(proposal.reviewed_at).toLocaleString()}</span>}
                  {proposal.executed_at && <span>Applied {new Date(proposal.executed_at).toLocaleString()}</span>}
                  {confidencePct !== null && (
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      Quality score
                      <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {confidencePct}%
                      </Badge>
                    </span>
                  )}
                </div>
                {proposal.validator_report.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {proposal.validator_report.warnings.length} warning{proposal.validator_report.warnings.length === 1 ? '' : 's'} detected
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {proposal.validator_report.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Database className="h-4 w-4 text-slate-500" />
                  Operations ({proposal.ops.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700">
                {groupedOperations.map(({ type, items }) => (
                  <div key={type} className="rounded-lg border border-slate-200 bg-white p-3 shadow-inner">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      {readableOperation(type)}
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.map((op, index) => (
                        <OperationPreview key={`${type}-${index}`} operation={op} />
                      ))}
                    </div>
                  </div>
                ))}
                {groupedOperations.length === 0 && (
                  <p className="text-sm text-slate-500">No operations present on this proposal.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  Provenance & Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Referenced captures</p>
                  {proposal.provenance.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-500">No raw dumps referenced.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {proposal.provenance.map((dumpId) => (
                        <li key={dumpId} className="font-mono text-xs text-slate-600">{dumpId}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {proposal.review_notes && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    <p className="text-xs uppercase tracking-wide text-blue-600">Review notes</p>
                    <p className="mt-1 whitespace-pre-line">{proposal.review_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {actionError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <ShieldOff className="mr-2 inline h-4 w-4" />
                {actionError}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-4">
          <Textarea
            placeholder="Add optional notes for this decision"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-[90px]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={submitting || loading || !proposal}
              className="flex items-center gap-2 text-rose-700 hover:text-rose-800"
            >
              <ShieldOff className="h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={submitting || loading || !proposal}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Approve'}
            </Button>
            <Button variant="ghost" onClick={onClose} className="sm:ml-2">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function readableOperation(type: string): string {
  switch (type) {
    case 'CreateBlock':
      return 'Create block';
    case 'ReviseBlock':
      return 'Revise block';
    case 'CreateContextItem':
      return 'Add context item';
    case 'MergeContextItems':
      return 'Merge context items';
    case 'PromoteScope':
      return 'Promote scope';
    case 'ArchiveBlock':
      return 'Archive block';
    case 'RedactDump':
      return 'Redact dump';
    default:
      return type.replace(/([A-Z])/g, ' $1').trim();
  }
}

function OperationPreview({ operation }: { operation: ProposalOperation }) {
  const entries = Object.entries(operation.data ?? {});
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 p-2 text-xs text-slate-500">
        No additional metadata provided.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
      <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="truncate">
            <dt className="font-medium uppercase tracking-wide text-slate-500">{key.replace(/_/g, ' ')}</dt>
            <dd className="text-slate-700">
              {typeof value === 'string' || typeof value === 'number'
                ? String(value)
                : JSON.stringify(value, null, 2)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
