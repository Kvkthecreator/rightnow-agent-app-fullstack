"use client";

import { useBasketMode } from '@/basket-modes/provider';
import clsx from 'clsx';

export function ModeDeliverablesPanel({ className }: { className?: string }) {
  const { config } = useBasketMode();
  if (!config.deliverables.length) {
    return null;
  }

  return (
    <section
      aria-label={`${config.label} deliverables`}
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        'p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Expected Outputs</p>
          <h2 className="text-lg font-semibold text-slate-900">{config.label}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {config.deliverables.length} deliverables
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {config.deliverables.map((deliverable) => (
          <li
            key={deliverable.id}
            className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <h3 className="text-sm font-semibold text-slate-900">{deliverable.title}</h3>
            <p className="text-sm text-slate-600">{deliverable.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
