"use client";

import useSWR from 'swr';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useBasketMode } from '@/basket-modes/provider';
import { useBasket } from '@/contexts/BasketContext';
import type { AnchorStatusSummary } from '@/lib/anchors/types';

const STATUS_BADGES: Record<AnchorStatusSummary['lifecycle'], string> = {
  missing: 'bg-rose-50 text-rose-700 border border-rose-200',
  draft: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  stale: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  archived: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const STATUS_LABELS: Record<AnchorStatusSummary['lifecycle'], string> = {
  missing: 'Needs capture',
  draft: 'In governance',
  approved: 'Canon locked',
  stale: 'Stale',
  archived: 'Archived',
};

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

  const { data, error, isLoading } = useSWR<{ anchors: AnchorStatusSummary[] }>(
    basket ? `/api/baskets/${basket.id}/anchors` : null,
    fetcher,
    { refreshInterval: 90_000 },
  );

  const byScope = useMemo(() => {
    const anchors = data?.anchors ?? [];
    return {
      core: anchors.filter((anchor) => anchor.scope === 'core'),
      brain: anchors.filter((anchor) => anchor.scope === 'brain'),
    };
  }, [data]);

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
          <AnchorSummaryGroup
            title="Core anchors"
            description="Keep these truths current. They ground every document and downstream brain."
            anchors={byScope.core}
            loading={isLoading}
            error={error}
          />

          <AnchorSummaryGroup
            title={`${config.label} anchors`}
            description="Specialised anchors that express this brain’s point of view."
            anchors={byScope.brain}
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
    </section>
  );
}

function AnchorSummaryGroup({
  title,
  description,
  anchors,
  loading,
  error,
}: {
  title: string;
  description: string;
  anchors: AnchorStatusSummary[];
  loading: boolean;
  error?: unknown;
}) {
  const errorMessage = error instanceof Error ? error.message : null;
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
        <p className="mt-3 rounded bg-rose-50 px-3 py-2 text-xs text-rose-600">Failed to load anchor status. Please retry.</p>
      )}
      <ul className="mt-4 space-y-3">
        {anchors.map((anchor) => (
          <li
            key={anchor.anchor_key}
            className="flex flex-col gap-3 rounded-md border border-slate-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{anchor.label}</p>
              <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_BADGES[anchor.lifecycle])}>
                {STATUS_LABELS[anchor.lifecycle]}
              </span>
              {!anchor.required && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{anchor.description || 'No description provided.'}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>{anchor.relationships} connections</span>
              {anchor.last_updated_at && <span>Updated {new Date(anchor.last_updated_at).toLocaleDateString()}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
