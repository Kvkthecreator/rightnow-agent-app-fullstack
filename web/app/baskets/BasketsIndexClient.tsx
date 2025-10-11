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
  updated_at?: string | null;
  mode: BasketMode;
  pendingProposals: {
    count: number;
    lastCreatedAt: string | null;
    origin: string | null;
  };
};

export function BasketsIndexClient({ baskets }: { baskets: BasketSummary[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasBaskets = baskets.length > 0;
  const sortedBaskets = useMemo(
    () => [...baskets].sort((a, b) => b.updated_at?.localeCompare(a.updated_at ?? '') ?? 0),
    [baskets],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Context library</h1>
          <p className="text-sm text-muted-foreground">
            Browse the baskets that store your governed knowledge. Connect Claude or ChatGPT from the dashboard to feed them ambiently.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New basket</Button>
      </header>

      {!hasBaskets ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold">No baskets yet</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Create a basket for each product or project. Ambient captures from Claude and ChatGPT will flow into the right basket once integrations are linked.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setDialogOpen(true)}>Create basket</Button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card">
          <div className="grid grid-cols-4 gap-0 border-b px-4 py-2 text-xs font-semibold uppercase text-muted-foreground sm:grid-cols-5">
            <span className="col-span-2">Basket</span>
            <span>Status</span>
            <span className="hidden sm:block">Last activity</span>
            <span>Pending</span>
          </div>
          <div className="divide-y">
            {sortedBaskets.map((basket) => (
              <button
                key={basket.id}
                type="button"
                onClick={() => router.push(`/baskets/${basket.id}/memory`)}
                className="grid w-full grid-cols-4 items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-muted sm:grid-cols-5"
              >
                <div className="col-span-2 flex flex-col">
                  <span className="font-medium text-foreground">{basket.name || 'Untitled basket'}</span>
                  <span className="text-xs text-muted-foreground">Mode · {basket.mode.replace('_', ' ')}</span>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{basket.status ?? '—'}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {basket.updated_at ? new Date(basket.updated_at).toLocaleString() : new Date(basket.created_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {basket.pendingProposals.count}
                  {basket.pendingProposals.count > 0 && (
                    <span className="text-muted-foreground">
                      · {basket.pendingProposals.origin === 'agent' ? 'Ambient' : 'Manual'}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <CreateBasketDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
