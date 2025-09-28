"use client";

import { useBasketMode } from '@/basket-modes/provider';
import { useBasket } from '@/contexts/BasketContext';
import clsx from 'clsx';

export function ModeOnboardingPanel({ className }: { className?: string }) {
  const { config } = useBasketMode();
  const { basket } = useBasket();
  const steps = config.onboarding.steps;
  if (!steps.length) {
    return null;
  }

  return (
    <section
      aria-label={`${config.label} onboarding`}
      className={clsx(
        'rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm',
        'p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Mode</p>
          <h2 className="text-lg font-semibold text-slate-900">{config.label}</h2>
          <p className="text-sm text-slate-600">{config.tagline}</p>
        </div>
        <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {config.onboarding.headline}
        </div>
      </div>

      <ol className="mt-4 space-y-4">
        {steps.map((step, idx) => (
          <li key={step.id} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700">
              {idx + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.description}</p>
              {step.cta && (
                <a
                  href={
                    step.cta.href.startsWith('/') && basket
                      ? `/baskets/${basket.id}${step.cta.href}`
                      : step.cta.href
                  }
                  className="mt-2 inline-flex items-center text-sm font-medium text-indigo-700 hover:text-indigo-800"
                >
                  {step.cta.label} →
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {config.onboarding.completion}
      </p>
    </section>
  );
}
