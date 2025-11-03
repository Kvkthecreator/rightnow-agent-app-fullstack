"use client";

import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AnchorStatusSummary } from '@/lib/anchors/types';
import { Clock, Link as LinkIcon, PenTool, Sparkles } from 'lucide-react';

const STATUS_VARIANTS: Record<AnchorStatusSummary['lifecycle'], { label: string; badgeClass: string }> = {
  missing: { label: 'Needs capture', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
  draft: { label: 'In governance', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Canon locked', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  stale: { label: 'Stale', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  archived: { label: 'Archived', badgeClass: 'bg-slate-200 text-slate-700 border-slate-300' },
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function scopeLabel(scope: AnchorStatusSummary['scope']) {
  switch (scope) {
    case 'core':
      return 'Core anchor';
    case 'brain':
      return 'Brain anchor';
    default:
      return 'Custom anchor';
  }
}

interface AnchorCardProps {
  anchor: AnchorStatusSummary;
  onCapture: (anchor: AnchorStatusSummary) => void;
  onViewRelationships?: (anchor: AnchorStatusSummary) => void;
  onEditMeta?: (anchor: AnchorStatusSummary) => void;
}

export function AnchorCard({ anchor, onCapture, onViewRelationships, onEditMeta }: AnchorCardProps) {
  const statusMeta = STATUS_VARIANTS[anchor.lifecycle];
  const canCapture = anchor.lifecycle === 'missing' || anchor.lifecycle === 'draft' || anchor.lifecycle === 'stale';
  const canRevise = anchor.lifecycle === 'approved';
  const substrateSummary = anchor.linked_substrate;

  const subtitle = useMemo(() => {
    if (!substrateSummary) return 'No canon content captured yet.';
    if (anchor.lifecycle === 'stale') {
      return 'Refresh this anchor to keep downstream artefacts current.';
    }
    return substrateSummary.content_snippet ? substrateSummary.content_snippet : 'Anchored but no summary available yet.';
  }, [substrateSummary, anchor.lifecycle]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{anchor.label}</h3>
            <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
            {anchor.required && (
              <Badge variant="outline" className="border-slate-300 text-slate-600">Required</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">{scopeLabel(anchor.scope)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCapture && (
            <Button size="sm" onClick={() => onCapture(anchor)}>
              <PenTool className="h-3.5 w-3.5" />
              Capture
            </Button>
          )}
          {canRevise && (
            <Button size="sm" variant="outline" onClick={() => onCapture(anchor)}>
              <Sparkles className="h-3.5 w-3.5" />
              Revise
            </Button>
          )}
          {onViewRelationships && substrateSummary?.id && (
            <Button size="sm" variant="ghost" onClick={() => onViewRelationships(anchor)}>
              <LinkIcon className="h-3.5 w-3.5" />
              Relationships
            </Button>
          )}
          {onEditMeta && anchor.scope === 'custom' && (
            <Button size="sm" variant="ghost" onClick={() => onEditMeta(anchor)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <p>{subtitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {formatDate(anchor.last_updated_at)}
          </span>
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            {anchor.relationships} connections
          </span>
        </div>
      </div>
    </div>
  );
}
