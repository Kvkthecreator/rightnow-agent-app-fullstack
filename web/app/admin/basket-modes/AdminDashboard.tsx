"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BasketModeConfig, BasketModeId } from '@/basket-modes/types';
import { DEFAULT_MODE_CONFIGS } from '@/basket-modes/defaults';

export type BasketSummary = {
  id: string;
  name: string | null;
  mode: string | null;
  created_at: string;
  status?: string | null;
};

export type BasketModeConfigMap = Record<BasketModeId, BasketModeConfig>;

type EditingState = {
  modeId: BasketModeId;
  draft: string;
};

type StatusState = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

const STATUS_CLASS: Record<StatusState['tone'], string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-amber-200 bg-amber-50 text-amber-800',
};

async function persistConfig(modeId: BasketModeId, config: BasketModeConfig) {
  const response = await fetch('/api/admin/basket-modes/configs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode_id: modeId,
      config,
      updated_by: 'basket-mode-admin',
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? 'Failed to persist config');
  }

  const payload = await response.json();
  return payload.config as BasketModeConfig;
}

export function AdminDashboard({
  baskets: initialBaskets,
  configs: initialConfigs,
}: {
  baskets: BasketSummary[];
  configs: BasketModeConfigMap;
}) {
  const router = useRouter();
  const [baskets, setBaskets] = useState(initialBaskets);
  const [configs, setConfigs] = useState(initialConfigs);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [savingMode, setSavingMode] = useState<BasketModeId | null>(null);

  const modeList = useMemo(() => {
    const entries = Object.entries(configs) as [BasketModeId, BasketModeConfig][];
    return entries.sort((a, b) => a[0].localeCompare(b[0]));
  }, [configs]);

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
      setStatus({ tone: 'success', message: 'Mode updated successfully.' });
    } catch (error) {
      console.error('Failed to update basket mode', error);
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
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

  function startEditing(modeId: BasketModeId) {
    const config = configs[modeId];
    setEditing({
      modeId,
      draft: JSON.stringify(config, null, 2),
    });
    setStatus({ tone: 'info', message: `Editing configuration for ${modeId}` });
  }

  function cancelEditing() {
    setEditing(null);
    setStatus(null);
  }

  async function saveEditing() {
    if (!editing) return;
    setSavingMode(editing.modeId);
    try {
      const parsed = JSON.parse(editing.draft);
      const merged: BasketModeConfig = {
        ...parsed,
        id: editing.modeId,
      };
      const persisted = await persistConfig(editing.modeId, merged);
      setConfigs((prev) => ({ ...prev, [editing.modeId]: persisted }));
      setStatus({ tone: 'success', message: `Saved configuration for ${editing.modeId}.` });
      setEditing(null);
    } catch (error) {
      console.error('Failed to save mode config', error);
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to save configuration',
      });
    } finally {
      setSavingMode(null);
    }
  }

  async function resetToDefault(modeId: BasketModeId) {
    setSavingMode(modeId);
    try {
      const defaults = DEFAULT_MODE_CONFIGS[modeId];
      const persisted = await persistConfig(modeId, defaults);
      setConfigs((prev) => ({ ...prev, [modeId]: persisted }));
      setStatus({ tone: 'success', message: `Reset ${modeId} to defaults.` });
      if (editing?.modeId === modeId) {
        setEditing({ modeId, draft: JSON.stringify(persisted, null, 2) });
      }
    } catch (error) {
      console.error('Failed to reset config', error);
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset configuration',
      });
    } finally {
      setSavingMode(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Basket Brain Control Center</h1>
          <p className="text-sm text-slate-600">
            Adjust brain configurations and assign modes to baskets.
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
        <div className={`rounded-md border px-4 py-2 text-sm ${STATUS_CLASS[status.tone]}`}>
          {status.message}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Brain Configurations</h2>
            <p className="mt-1 text-sm text-slate-600">
              Edit anchors, capture recipes, and deliverables for each brain. JSON payload must match the schema in <code className="rounded bg-slate-100 px-1 py-0.5">web/basket-modes/schema.ts</code>.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {modeList.map(([modeId, config]) => {
            const isEditing = editing?.modeId === modeId;
            return (
              <div key={modeId} className="rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-indigo-600">{modeId}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{config.label}</h3>
                    <p className="text-sm text-slate-600">{config.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Anchors: {config.anchors.core.length + config.anchors.brain.length}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Capture recipes: {config.captureRecipes.length}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Deliverables: {config.deliverables.length}</span>
                      {config.wizards?.setup?.enabled && (
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                          Setup Wizard: {config.wizards.setup.steps.length} steps
                        </span>
                      )}
                      {config.wizards?.upload?.enabled && (
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                          Upload Wizard: max {config.wizards.upload.maxDocuments} docs
                        </span>
                      )}
                    </div>
                    {config.wizards?.setup?.enabled && (
                      <details className="mt-3 rounded-md border border-indigo-100 bg-indigo-50/50 p-3">
                        <summary className="cursor-pointer text-xs font-medium text-indigo-900">
                          Setup Wizard Preview ({config.wizards.setup.steps.length} steps)
                        </summary>
                        <div className="mt-3 space-y-2">
                          {config.wizards.setup.steps.map((step, idx) => (
                            <div key={step.id} className="rounded border border-indigo-200 bg-white p-2 text-xs">
                              <p className="font-semibold text-slate-900">
                                Step {idx + 1}: {step.question}
                              </p>
                              <p className="mt-1 text-slate-600">{step.prompt}</p>
                              {step.anchorRefs && step.anchorRefs.length > 0 && (
                                <p className="mt-1 text-indigo-700">
                                  → Anchors: {step.anchorRefs.join(', ')}
                                </p>
                              )}
                              {step.optional && (
                                <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                  Optional
                                </span>
                              )}
                            </div>
                          ))}
                          {config.wizards.setup.immediateArtifacts && (
                            <div className="rounded border border-green-200 bg-green-50 p-2 text-xs">
                              <p className="font-semibold text-green-900">
                                Immediate artifacts: {config.wizards.setup.immediateArtifacts.join(', ')}
                              </p>
                            </div>
                          )}
                          {config.wizards.setup.queuedArtifacts && (
                            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs">
                              <p className="font-semibold text-amber-900">
                                Queued artifacts: {config.wizards.setup.queuedArtifacts.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-2 self-start">
                    <button
                      onClick={() => resetToDefault(modeId)}
                      disabled={savingMode === modeId}
                      className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {savingMode === modeId ? 'Resetting…' : 'Reset to defaults'}
                    </button>
                    {isEditing ? (
                      <button
                        onClick={cancelEditing}
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(modeId)}
                        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        Edit JSON
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="h-80 w-full rounded-md border border-slate-300 bg-slate-900/5 font-mono text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={editing.draft}
                      onChange={(event) => setEditing({ modeId, draft: event.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={saveEditing}
                        disabled={savingMode === modeId}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                      >
                        {savingMode === modeId ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                      {modeList.map(([modeId, cfg]) => (
                        <option key={modeId} value={modeId}>
                          {cfg.label} ({modeId})
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
