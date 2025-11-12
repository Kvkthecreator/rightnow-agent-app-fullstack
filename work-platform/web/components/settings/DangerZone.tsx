"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DangerZoneProps {
  userEmail: string;
}

export function DangerZone({ userEmail }: DangerZoneProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [emailInput, setEmailInput] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetModal = () => {
    setShowModal(false);
    setStep(1);
    setEmailInput('');
    setConfirmText('');
    setError(null);
    setPurging(false);
  };

  const handleContinue = () => {
    if (emailInput.toLowerCase() === userEmail.toLowerCase()) {
      setStep(2);
      setError(null);
    } else {
      setError('Email does not match your account');
    }
  };

  const handlePurge = async () => {
    if (confirmText !== 'DELETE MY WORKSPACE DATA') {
      setError('Confirmation text does not match');
      return;
    }

    setPurging(true);
    setError(null);

    try {
      const res = await fetch('/api/workspaces/purge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_confirmation: emailInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Purge failed');
      }

      router.push('/dashboard?purged=true');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPurging(false);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-danger-border bg-surface-danger/80 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-destructive-foreground">
          <h3 className="text-base font-semibold mb-2">Danger Zone</h3>
          <div className="space-y-3 text-sm">
            <p className="font-medium">Purge Workspace Data</p>
            <p>Permanently delete all projects, work sessions, baskets, blocks, documents, and context in your workspace. This cannot be undone.</p>
            <p>Other users' workspaces are not affected.</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            variant="destructive"
            size="sm"
            className="mt-4"
          >
            Purge Workspace Data
          </Button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold">
                  {step === 1 ? 'Purge Workspace Data' : 'Final Confirmation'}
                </h2>
              </div>
              <button onClick={resetModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              {step === 1 && (
                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-surface-danger-border bg-surface-danger/80 p-3 text-destructive-foreground">
                    <p className="font-semibold mb-2">This will permanently delete:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All projects and assigned agents</li>
                      <li>All work sessions, artifacts, and checkpoints</li>
                      <li>All baskets and context blocks</li>
                      <li>All documents and versions</li>
                      <li>All raw dumps and captured memory</li>
                      <li>All relationships and timeline events</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/60 p-3 text-muted-foreground">
                    <p className="font-semibold mb-2">What stays:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your account and login</li>
                      <li>Your workspace (empty but accessible)</li>
                      <li>Workspace settings and governance rules</li>
                      <li>Integration connections (if any)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Type your email to confirm:</label>
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={userEmail}
                    />
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>

                  {error && (
                    <div className="rounded border border-surface-danger-border bg-surface-danger/80 p-2 text-destructive-foreground">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-surface-danger-border bg-surface-danger p-3 text-destructive-foreground">
                    <p className="font-bold mb-1">⚠️ Final Warning</p>
                    <p>This action is irreversible. All your workspace data will be permanently deleted.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Type <span className="font-mono font-bold">DELETE MY WORKSPACE DATA</span> to confirm:
                    </label>
                    <Input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE MY WORKSPACE DATA"
                      className="font-mono"
                    />
                  </div>

                  {error && (
                    <div className="rounded border border-surface-danger-border bg-surface-danger/80 p-2 text-destructive-foreground">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4">
              <Button onClick={resetModal} variant="outline" size="sm" disabled={purging}>
                Cancel
              </Button>
              {step === 1 && (
                <Button onClick={handleContinue} size="sm" variant="destructive" disabled={!emailInput}>
                  Continue
                </Button>
              )}
              {step === 2 && (
                <Button
                  onClick={handlePurge}
                  size="sm"
                  variant="destructive"
                  disabled={confirmText !== 'DELETE MY WORKSPACE DATA' || purging}
                >
                  {purging ? 'Purging...' : 'Purge Workspace'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
