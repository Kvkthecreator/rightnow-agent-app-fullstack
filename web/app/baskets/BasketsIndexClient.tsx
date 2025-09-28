"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
            Each basket is an independent substrate workspace. Switch modes, compose documents, and govern memory per basket.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New basket</Button>
      </header>

      {!hasBaskets && (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No baskets yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create your first basket to start capturing memories and composing documents.
          </p>
          <div className="mt-6">
            <Button onClick={() => setDialogOpen(true)}>Create your first basket</Button>
          </div>
        </section>
      )}

      {hasBaskets && (
        <section className="grid gap-4 md:grid-cols-2">
          {sortedBaskets.map((basket) => (
            <Link
              key={basket.id}
              href={`/baskets/${basket.id}/memory`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                  {basket.name || 'Untitled basket'}
                </h2>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-700">
                  {basket.mode}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-slate-500">Status</dt>
                  <dd className="uppercase tracking-wide">{basket.status ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-slate-500">Created</dt>
                  <dd>{new Date(basket.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </section>
      )}

      <CreateBasketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
