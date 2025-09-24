"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { notificationAPI } from '@/lib/api/notifications';

export function DocumentCreateButton({ basketId }: { basketId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'blank' | 'memory' | null>(null);
  const [title, setTitle] = useState('Untitled Document');
  const [intent, setIntent] = useState('');
  const [creating, setCreating] = useState(false);

  const startBlank = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId, title })
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      notificationAPI.emitActionResult('document.create', 'Document created successfully', { severity: 'success' });
      router.push(`/baskets/${basketId}/documents/${data.document_id}`);
    } catch (e) {
      notificationAPI.emitActionResult('document.create', 'Failed to create document', { severity: 'error' });
    } finally {
      setCreating(false);
      setOpen(false);
    }
  };

  const composeFromMemory = async () => {
    setCreating(true);
    try {
      // Canon-Pure: Direct document composition (artifact operation, no governance)
      const res = await fetch('/api/documents/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          intent,
          basket_id: basketId,
          window_days: 30, // Default to last 30 days
          pinned_ids: [] // Could be extended for UI pinning
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.document_id) throw new Error(data?.error || 'Compose failed');
      
      // Navigate directly to the created document
      router.push(`/baskets/${basketId}/documents/${data.document_id}`);
    } catch (e) {
      notificationAPI.emitActionResult('document.compose', 'Failed to compose document', { severity: 'error' });
    } finally {
      setCreating(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => setOpen(v => !v)} size="sm" variant="outline">Create Document</Button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-10 p-3">
          {!mode && (
            <div className="space-y-2">
              <button className={itemCls()} onClick={() => setMode('blank')}>Start Blank</button>
              <button className={itemCls()} onClick={() => setMode('memory')}>Compose From Memory</button>
            </div>
          )}
          {mode === 'blank' && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Start Blank</div>
              <input className="w-full border p-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setMode(null)}>Back</Button>
                <Button size="sm" onClick={startBlank} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
              </div>
            </div>
          )}
          {mode === 'memory' && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Compose From Memory</div>
              <input className="w-full border p-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <textarea className="w-full border p-2 text-sm" value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Objective/intent (optional)" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setMode(null)}>Back</Button>
                <Button size="sm" onClick={composeFromMemory} disabled={creating}>{creating ? 'Composing...' : 'Compose'}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function itemCls() {
  return cn('w-full text-left px-3 py-2 rounded hover:bg-gray-50 border');
}

