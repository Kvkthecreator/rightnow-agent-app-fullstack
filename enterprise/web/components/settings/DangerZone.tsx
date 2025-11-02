"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, X } from 'lucide-react';

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

      // Success - redirect to dashboard
      router.push('/dashboard?purged=true');
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPurging(false);
    }
  };

  return (
    <div className="border border-red-200 rounded-lg bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-red-900 mb-2">Danger Zone</h3>
          <div className="space-y-3 text-sm text-red-800">
            <p className="font-medium">Purge Workspace Data</p>
            <p className="text-red-700">
              Permanently delete all baskets, documents, and memory in your workspace.
              This cannot be undone.
            </p>
            <p className="text-red-700">
              Other users' workspaces are not affected.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            variant="outline"
            size="sm"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            Purge Workspace Data
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {step === 1 ? 'Purge Workspace Data' : 'Final Confirmation'}
                </h2>
              </div>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                    <p className="font-semibold mb-2">This will permanently delete:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All baskets and building blocks</li>
                      <li>All documents and versions</li>
                      <li>All raw dumps and captured memory</li>
                      <li>All relationships and context items</li>
                      <li>All reflections and insights</li>
                      <li>All timeline events and proposals</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700">
                    <p className="font-semibold mb-2">What stays:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your account and login</li>
                      <li>Your workspace settings</li>
                      <li>Integration connections (if any)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Type your email to confirm:
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={userEmail}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-slate-500">{userEmail}</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-red-100 border border-red-300 rounded p-3 text-sm text-red-900">
                    <p className="font-bold mb-1">⚠️ Final Warning</p>
                    <p>This action is irreversible. All your workspace data will be permanently deleted.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Type <span className="font-mono font-bold">DELETE MY WORKSPACE DATA</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE MY WORKSPACE DATA"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
              <Button
                onClick={resetModal}
                variant="outline"
                size="sm"
                disabled={purging}
              >
                Cancel
              </Button>

              {step === 1 && (
                <Button
                  onClick={handleContinue}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!emailInput}
                >
                  Continue
                </Button>
              )}

              {step === 2 && (
                <Button
                  onClick={handlePurge}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
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
