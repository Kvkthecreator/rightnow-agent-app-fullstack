"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import CreateBasketDialog from '@/components/CreateBasketDialog';
import type { BasketMode } from '@/shared/contracts/baskets';

export type BasketSummary = {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string;
  mode: BasketMode;
};

export function BasketsIndexClient({ baskets }: { baskets: BasketSummary[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasBaskets = baskets.length > 0;
  const sortedBaskets = useMemo(
    () => [...baskets].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [baskets],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your baskets</h1>
          <p className="text-sm text-slate-600">
            Baskets keep a product or project in one place. Pick a basket, capture what you know, and let Yarnnn help with the rest.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New basket</Button>
      </header>

      {!hasBaskets && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Start your first basket</h2>
          <p className="mt-3 text-sm text-slate-600">
            Drop in what you already have—notes, research, thoughts. We’ll help organise core truths and build the rest with you.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setDialogOpen(true)}>Create basket</Button>
          </div>
        </section>
      )}

      {hasBaskets && (
        <section className="grid gap-4 md:grid-cols-2">
          {sortedBaskets.map((basket) => (
            <button
              key={basket.id}
              type="button"
              onClick={() => router.push(`/baskets/${basket.id}/memory`)}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                  {basket.name || 'Untitled basket'}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                  {basket.mode.replace('_', ' ')}
                </span>
              </div>
              <dl className="mt-4 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2 text-slate-500">
                  <dt className="font-medium">Status</dt>
                  <dd className="uppercase tracking-wide text-slate-700">{basket.status ?? '—'}</dd>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <dt className="font-medium">Created</dt>
                  <dd>{new Date(basket.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </button>
          ))}
        </section>
      )}

      <CreateBasketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
