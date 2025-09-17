"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
      router.push(`/baskets/${basketId}/documents/${data.document_id}`);
    } catch (e) {
      alert('Failed to create document');
    } finally {
      setCreating(false);
      setOpen(false);
    }
  };

  const composeFromMemory = async () => {
    setCreating(true);
    try {
      // Use canonical /api/work endpoint with P4_COMPOSE work type
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'P4_COMPOSE',
          work_payload: {
            operations: [{
              type: 'compose_from_memory',
              data: {
                title,
                intent,
                narrative_sections: [{ id: 'intro', content: intent || 'Draft', order: 0 }],
                substrate_references: [],
                composition_context: { 
                  intent,
                  trace_id: crypto.randomUUID(),
                  window: { days: 30 } // Default to last 30 days
                }
              }
            }],
            basket_id: basketId,
            confidence_score: 0.9, // High confidence for user-initiated composition
            user_override: 'allow_auto'
          },
          priority: 'normal'
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.work_id) throw new Error(data?.error || 'Compose failed');
      
      // Store work status for tracking (universal work orchestration)
      sessionStorage.setItem(`compose_work_${data.work_id}`, JSON.stringify({
        work_id: data.work_id,
        status_url: data.status_url,
        work_type: 'P4_COMPOSE',
        title,
        basket_id: basketId
      }));
      
      // Navigate to basket with work status (document will be created async)
      router.push(`/baskets/${basketId}?work_id=${data.work_id}&work_type=P4_COMPOSE`);
    } catch (e) {
      alert('Failed to compose document');
    } finally {
      setCreating(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => setOpen(v => !v)}>New Document</Button>
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

