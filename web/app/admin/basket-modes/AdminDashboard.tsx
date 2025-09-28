"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type BasketSummary = {
  id: string;
  name: string | null;
  mode: string | null;
  created_at: string;
  status?: string | null;
};

type ModeOption = {
  id: string;
  label: string;
  tagline: string;
  description: string;
};

export function AdminDashboard({
  baskets: initialBaskets,
  modes,
}: {
  baskets: BasketSummary[];
  modes: ModeOption[];
}) {
  const router = useRouter();
  const [baskets, setBaskets] = useState(initialBaskets);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);

  async function updateBasketMode(basketId: string, mode: string) {
    setBusyId(basketId);
    setStatus(null);
    try {
      const response = await fetch(`/api/baskets/${basketId}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to update mode');
      }

      setBaskets((prev) =>
        prev.map((basket) => (basket.id === basketId ? { ...basket, mode } : basket)),
      );
      setStatus('Mode updated successfully.');
    } catch (error) {
      console.error('Failed to update basket mode', error);
      setStatus(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await fetch('/api/admin/basket-modes/logout', { method: 'POST' });
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Basket Mode Control Center</h1>
          <p className="text-sm text-slate-600">
            Adjust basket modes and review copy used for each productized experience.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={logoutBusy}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logoutBusy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {status && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {status}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Available Modes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mode configs live in code under <code className="rounded bg-slate-100 px-1 py-0.5">web/basket-modes</code>.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {modes.map((mode) => (
            <div key={mode.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{mode.label}</h3>
                  <p className="text-xs uppercase tracking-wide text-indigo-600">{mode.id}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {mode.tagline}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{mode.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Baskets</h2>
        <p className="mt-1 text-sm text-slate-600">
          Change a basket&apos;s mode to reframe onboarding and deliverable emphasis instantly.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Mode</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Created</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baskets.map((basket) => (
                <tr key={basket.id}>
                  <td className="px-4 py-3 text-slate-900">{basket.name ?? 'Untitled basket'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={basket.mode ?? 'default'}
                      onChange={(event) => updateBasketMode(basket.id, event.target.value)}
                      disabled={busyId === basket.id}
                    >
                      {modes.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.id}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(basket.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{basket.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
