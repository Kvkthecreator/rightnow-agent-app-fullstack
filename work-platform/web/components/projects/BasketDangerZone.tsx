'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SettingsSection from '@/components/settings/SettingsSection';

interface BasketDangerZoneProps {
  projectId: string;
  projectName: string;
  basketId: string;
  basketStats: {
    blocks: number;
    dumps: number;
  };
}

type PurgeMode = 'archive_all' | 'redact_dumps';

export function BasketDangerZone({
  projectId,
  projectName,
  basketId,
  basketStats,
}: BasketDangerZoneProps) {
  const [mode, setMode] = useState<PurgeMode>('redact_dumps');
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    totals?: {
      archivedBlocks: number;
      redactedDumps: number;
    };
  } | null>(null);

  const handlePurge = async () => {
    if (confirmationText !== projectName) {
      alert('Project name does not match. Please type the exact project name.');
      return;
    }

    if (!confirm(
      mode === 'archive_all'
        ? 'This will archive all context blocks AND redact all raw dumps. This action cannot be undone. Continue?'
        : 'This will redact all raw dumps while keeping extracted context blocks. Continue?'
    )) {
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          confirmation_text: confirmationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to purge basket data');
      }

      setResult({
        success: true,
        message: data.message || 'Purge completed successfully',
        totals: data.totals,
      });

      setConfirmationText('');

      // Refresh page after 3 seconds to update stats
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('[Basket Purge] Error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to purge basket data',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isConfirmed = confirmationText === projectName;
  const hasData = basketStats.blocks > 0 || basketStats.dumps > 0;

  return (
    <SettingsSection
      title="Danger Zone"
      description="Permanently delete project context data"
    >
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-red-900 text-lg">
                Purge Basket Data
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete context data for this project. This action cannot be undone.
              </p>
            </div>

            {/* Stats Display */}
            <div className="bg-white rounded-md border border-red-200 p-4">
              <p className="text-sm font-medium text-slate-900 mb-2">
                Current basket contents:
              </p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• {basketStats.blocks} context block{basketStats.blocks !== 1 ? 's' : ''}</li>
                <li>• {basketStats.dumps} raw dump{basketStats.dumps !== 1 ? 's' : ''}</li>
              </ul>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-red-900">
                Purge Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-md border-2 bg-white cursor-pointer hover:border-red-300 transition-colors">
                  <input
                    type="radio"
                    name="purge-mode"
                    value="redact_dumps"
                    checked={mode === 'redact_dumps'}
                    onChange={(e) => setMode(e.target.value as PurgeMode)}
                    disabled={isProcessing}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Redact Dumps Only
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Delete raw dumps while keeping extracted context blocks (meaning preserved)
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-md border-2 bg-white cursor-pointer hover:border-red-300 transition-colors">
                  <input
                    type="radio"
                    name="purge-mode"
                    value="archive_all"
                    checked={mode === 'archive_all'}
                    onChange={(e) => setMode(e.target.value as PurgeMode)}
                    disabled={isProcessing}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Archive All & Redact
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Archive all context blocks AND redact all raw dumps (complete removal)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-red-900">
                Type project name to confirm: <span className="font-mono">{projectName}</span>
              </label>
              <Input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={projectName}
                disabled={isProcessing || !hasData}
                className="font-mono"
              />
            </div>

            {/* Action Button */}
            <Button
              onClick={handlePurge}
              disabled={!isConfirmed || isProcessing || !hasData}
              variant="default"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Purging...
                </>
              ) : (
                `Purge Basket (${mode === 'archive_all' ? 'Archive All' : 'Redact Dumps'})`
              )}
            </Button>

            {!hasData && (
              <p className="text-xs text-red-700 text-center">
                No data to purge. Basket is already empty.
              </p>
            )}

            {/* Result Display */}
            {result && (
              <div
                className={`rounded-md p-4 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-100 border border-red-300'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.message}
                </p>
                {result.success && result.totals && (
                  <ul className="text-xs text-green-700 mt-2 space-y-1">
                    {result.totals.archivedBlocks > 0 && (
                      <li>• Archived {result.totals.archivedBlocks} blocks</li>
                    )}
                    {result.totals.redactedDumps > 0 && (
                      <li>• Redacted {result.totals.redactedDumps} dumps</li>
                    )}
                  </ul>
                )}
                {result.success && (
                  <p className="text-xs text-green-600 mt-2">
                    Page will refresh automatically...
                  </p>
                )}
              </div>
            )}

            {/* Warning Footer */}
            <div className="text-xs text-red-700 space-y-1">
              <p className="font-medium">⚠️ This action is permanent and cannot be undone.</p>
              <p>Governance proposals related to this basket will remain visible for audit purposes.</p>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
