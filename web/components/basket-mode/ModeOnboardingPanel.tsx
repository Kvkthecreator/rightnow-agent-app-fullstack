"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useBasketMode } from '@/basket-modes/provider';
import { useBasket } from '@/contexts/BasketContext';
import type { AnchorSpec } from '@/basket-modes/types';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';

const statusCopy: Record<'missing' | 'in_progress' | 'complete', { label: string; tone: string; badge: string }> = {
  missing: {
    label: 'Needs capture',
    tone: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  in_progress: {
    label: 'In governance',
    tone: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  complete: {
    label: 'Ready',
    tone: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
};

interface AnchorStatus {
  id: string;
  label: string;
  scope: AnchorSpec['scope'];
  substrateType: AnchorSpec['substrateType'];
  required: boolean;
  status: 'missing' | 'in_progress' | 'complete';
  count: number;
  updated_at?: string | null;
  preview?: string | null;
  title?: string | null;
  content?: string | null;
}

interface AnchorEditorState {
  anchor: AnchorSpec;
  status?: AnchorStatus;
}

async function fetcher(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load anchor status');
  }
  return response.json();
}

export function ModeOnboardingPanel({ className }: { className?: string }) {
  const { config } = useBasketMode();
  const { basket } = useBasket();
  const [editorState, setEditorState] = useState<AnchorEditorState | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ anchors: AnchorStatus[] }>(
    basket ? `/api/baskets/${basket.id}/anchors/status` : null,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const byScope = useMemo(() => {
    const anchors = data?.anchors ?? [];
    return {
      core: anchors.filter((anchor) => anchor.scope === 'core'),
      brain: anchors.filter((anchor) => anchor.scope === 'brain'),
    };
  }, [data]);

  const anchorLookup = useMemo(() => {
    const all = [...config.anchors.core, ...config.anchors.brain];
    return new Map(all.map((anchor) => [anchor.id, anchor]));
  }, [config.anchors.core, config.anchors.brain]);

  const openEditor = (anchorId: string) => {
    const anchor = anchorLookup.get(anchorId);
    if (!anchor) return;
    const status = data?.anchors.find((item) => item.id === anchorId);
    setEditorState({ anchor, status });
  };

  return (
    <section
      aria-label={`${config.label} onboarding`}
      className={clsx(
        'rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm',
        'p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mode</p>
          <h2 className="text-lg font-semibold text-slate-900">{config.label}</h2>
          <p className="text-sm text-slate-600">{config.tagline}</p>
        </div>
        <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {config.onboarding.headline}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-5">
          <AnchorGroup
            title="Core anchors"
            description="Keep these truths current. They ground every document and downstream brain."
            anchors={config.anchors.core}
            statuses={byScope.core}
            onEdit={openEditor}
            loading={isLoading}
            error={error}
          />

          <AnchorGroup
            title={`${config.label} anchors`}
            description="Specialised anchors that express this brain’s point of view."
            anchors={config.anchors.brain}
            statuses={byScope.brain}
            onEdit={openEditor}
            loading={isLoading}
            error={error}
          />
        </div>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Suggested next actions</h3>
            <p className="mt-1 text-sm text-slate-600">Follow the flow to capture anchors, approve blocks, and compose artefacts.</p>
          </div>
          <ol className="space-y-3 text-sm text-slate-700">
            {config.onboarding.steps.map((step, idx) => (
              <li key={step.id} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{step.title}</p>
                  <p className="text-slate-600">{step.description}</p>
                  {step.cta && basket && (
                    <a
                      className="inline-flex items-center text-indigo-700 hover:text-indigo-800"
                      href={step.cta.href.startsWith('/') ? `/baskets/${basket.id}${step.cta.href}` : step.cta.href}
                    >
                      {step.cta.label} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="rounded-md bg-white px-3 py-2 text-xs text-slate-500">
            {config.onboarding.completion}
          </p>
        </aside>
      </div>

      {editorState && basket && (
        <AnchorEditor
          key={editorState.anchor.id}
          basketId={basket.id}
          anchor={editorState.anchor}
          status={editorState.status}
          onClose={() => setEditorState(null)}
          onSaved={async () => {
            setEditorState(null);
            await mutate();
          }}
        />
      )}
    </section>
  );
}

function AnchorGroup({
  title,
  description,
  anchors,
  statuses,
  onEdit,
  loading,
  error,
}: {
  title: string;
  description: string;
  anchors: AnchorSpec[];
  statuses: AnchorStatus[];
  onEdit: (anchorId: string) => void;
  loading: boolean;
  error?: unknown;
}) {
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Failed to load anchor status. Please retry.'
    : null;
  const statusMap = useMemo(() => new Map(statuses?.map((status) => [status.id, status])), [statuses]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        {loading && <span className="text-xs text-slate-400">Loading…</span>}
      </div>
      {errorMessage && (
        <p className="mt-3 rounded bg-rose-50 px-3 py-2 text-xs text-rose-600">{errorMessage}</p>
      )}
      <ul className="mt-4 space-y-3">
        {anchors.map((anchor) => {
          const status = statusMap.get(anchor.id);
          const state = status ? statusCopy[status.status] : statusCopy.missing;
          return (
            <li
              key={anchor.id}
              className="flex flex-col gap-3 rounded-md border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{anchor.label}</p>
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', state.badge)}>{state.label}</span>
                  {!anchor.required && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{anchor.description}</p>
                {status?.preview && (
                  <p className="text-sm text-slate-600">{status.preview}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(anchor.id)}
              >
                {status?.status === 'missing' ? 'Add anchor' : 'Edit anchor'}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AnchorEditor({
  basketId,
  anchor,
  status,
  onClose,
  onSaved,
}: {
  basketId: string;
  anchor: AnchorSpec;
  status?: AnchorStatus;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [content, setContent] = useState(status?.content ?? '');
  const [title, setTitle] = useState(status?.title ?? anchor.label);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim().length) {
      setError('Please provide content for this anchor.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/baskets/${basketId}/anchors/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchor_id: anchor.id,
          content,
          title,
        }),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || 'Failed to save anchor');
      }

      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save anchor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => { if (!next && !saving) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{anchor.label}</DialogTitle>
          <DialogDescription>
            {anchor.acceptanceCriteria || 'Populate this anchor with canon-friendly content.'}
          </DialogDescription>
        </DialogHeader>

        {anchor.substrateType === 'block' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="anchor-title">
              Title
            </label>
            <Input
              id="anchor-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="anchor-content">
            Content
          </label>
          <Textarea
            id="anchor-content"
            className="min-h-[200px]"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Capture the canonical truth for this anchor."
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !content.trim().length}>
            {saving ? 'Saving…' : 'Save anchor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
