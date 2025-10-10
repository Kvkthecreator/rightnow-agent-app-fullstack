"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { cn } from '@/lib/utils';

export interface UnassignedCapture {
  id: string;
  tool: string;
  summary: string | null;
  payload: Record<string, unknown> | null;
  fingerprint: Record<string, unknown> | null;
  candidates: Array<{ id?: string; name?: string; score?: number } | Record<string, unknown>> | null;
  status: string;
  assigned_basket_id: string | null;
  created_at: string | null;
}

interface BasketOption {
  id: string;
  name: string | null;
}

interface Props {
  captures: UnassignedCapture[];
  baskets: BasketOption[];
}

export default function UnassignedQueueClient({ captures, baskets }: Props) {
  const [items, setItems] = useState(captures);
  const [isPending, startTransition] = useTransition();

  const handleResolve = (id: string, status: 'assigned' | 'dismissed', basketId?: string) => {
    startTransition(async () => {
      const body: Record<string, unknown> = { status };
      if (basketId) {
        body.assigned_basket_id = basketId;
      }
      const res = await fetchWithToken(`/api/memory/unassigned/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error('Failed to resolve capture', await res.text());
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  };

  const renderRow = (item: UnassignedCapture) => {
    const candidates = Array.isArray(item.candidates) ? item.candidates : [];

    return (
      <div
        key={item.id}
        className="rounded-lg border border-border bg-card px-4 py-4 text-sm shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wide">
                {item.tool}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : '—'}
              </span>
            </div>
            <p className="font-medium text-foreground">
              {item.summary || deriveSummary(item)}
            </p>
            {candidates.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Suggested baskets:{' '}
                {candidates.slice(0, 3).map((candidate, idx) => {
                  const label = (candidate as any).name || (candidate as any).id || `Candidate ${idx + 1}`;
                  const score = (candidate as any).score;
                  return (
                    <span key={idx}>
                      {idx > 0 && ', '}
                      {label}
                      {typeof score === 'number' && ` (${score.toFixed(2)})`}
                    </span>
                  );
                })}
              </div>
            )}
            {item.payload && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">View payload</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AssignControl
            baskets={baskets}
            disabled={isPending}
            onAssign={(basketId) => handleResolve(item.id, 'assigned', basketId)}
          />
          <button
            type="button"
            onClick={() => handleResolve(item.id, 'dismissed')}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            disabled={isPending}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Unassigned Captures</h1>
        <p className="text-sm text-muted-foreground">
          Low-confidence captures from MCP integrations land here so you can route them to the right basket.
        </p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <p>No unassigned captures.</p>
          <p className="mt-1">
            Continue working inside Claude or ChatGPT. When Yarnnn cannot confidently select a basket, you&apos;ll assign it here.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {items.map(renderRow)}
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

function deriveSummary(item: UnassignedCapture) {
  if (item.payload && typeof item.payload === 'object') {
    const content = (item.payload as any).content;
    if (typeof content === 'string' && content.length > 0) {
      return content.length > 140 ? `${content.slice(0, 140)}…` : content;
    }
  }
  return 'Capture pending review';
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
        onChange={(e) => setSelected(e.target.value)}
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
          selected ? 'opacity-100' : 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => selected && onAssign(selected)}
        disabled={disabled || !selected}
      >
        Assign
      </button>
    </div>
  );
}
