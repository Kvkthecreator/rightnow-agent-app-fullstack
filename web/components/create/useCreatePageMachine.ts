'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/uploadFile';
import { sanitizeFilename } from '@/lib/utils/sanitizeFilename';
import { dlog } from '@/lib/dev/log';
import { toast } from 'react-hot-toast';

export type CreateState =
  | 'EMPTY'
  | 'COLLECTING'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PROCESSING_WITH_WARNINGS'
  | 'PREVIEW_READY'
  | 'COMPLETE'
  | 'ERROR';

export interface AddedItem {
  id: string;
  kind: 'file' | 'url' | 'note';
  name: string;
  size?: number;
  file?: File;
  url?: string;
  text?: string;
  status: 'queued' | 'uploading' | 'uploaded' | 'parsed' | 'fetched' | 'ready' | 'error';
  error?: string;
  storagePath?: string;
  mime?: string;
}

export function useCreatePageMachine() {
  const router = useRouter();
  const [state, setState] = useState<CreateState>('EMPTY');
  const [intent, setIntent] = useState('');
  const [items, setItems] = useState<AddedItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const logEvent = (e: any) => {
    try {
      const log = JSON.parse(localStorage.getItem('create:lastRun') || '[]');
      log.push({ t: Date.now(), ...e });
      localStorage.setItem('create:lastRun', JSON.stringify(log).slice(-5000));
    } catch {}
  };

  useEffect(() => {
    dlog('telemetry', { event: 'create_viewed' });
  }, []);

  // recompute state when intent/items change
  const recompute = (nextIntent: string, nextItems: AddedItem[]) => {
    if (nextIntent.trim() !== '' || nextItems.length > 0) {
      setState((prev) => (prev === 'EMPTY' ? 'COLLECTING' : prev));
    } else {
      setState('EMPTY');
    }
  };

  const setIntentWrapper = (v: string) => {
    setIntent(v);
    recompute(v, items);
  };

  const addFiles = (files: File[]) => {
    const newItems: AddedItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      kind: 'file',
      name: f.name,
      size: f.size,
      file: f,
      status: 'queued',
    }));
    const merged = [...items, ...newItems];
    setItems(merged);
    recompute(intent, merged);
    dlog('telemetry', { event: 'create_added_item', type: 'file' });
  };

  const addUrl = (url: string) => {
    const newItem: AddedItem = {
      id: crypto.randomUUID(),
      kind: 'url',
      name: url,
      url,
      status: 'queued',
    };
    const merged = [...items, newItem];
    setItems(merged);
    recompute(intent, merged);
    dlog('telemetry', { event: 'create_added_item', type: 'url' });
  };

  const addNote = (text: string) => {
    const newItem: AddedItem = {
      id: crypto.randomUUID(),
      kind: 'note',
      name: text.slice(0, 30),
      text,
      status: 'ready',
    };
    const merged = [...items, newItem];
    setItems(merged);
    recompute(intent, merged);
    dlog('telemetry', { event: 'create_added_item', type: 'note' });
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((it) => it.id !== id);
    setItems(filtered);
    recompute(intent, filtered);
  };

  const clearAll = () => {
    setItems([]);
    setIntent('');
    setState('EMPTY');
  };

  // pseudo progress
  useEffect(() => {
    if (state === 'SUBMITTED' || state === 'PROCESSING') {
      const interval = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 5 : p));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [state]);

  const generate = async () => {
    if (items.length === 0 && intent.trim() === '') return;
    if (state === 'SUBMITTED' || state === 'PROCESSING') return;

    dlog('telemetry', { event: 'create_generate_clicked' });
    setState('SUBMITTED');
    setProgress(5);
    try {
      const reqId = `ui-${Date.now()}`;

      for (const item of items) {
        if (item.kind === 'file' && item.file) {
          try {
            item.status = 'uploading';
            const sanitized = sanitizeFilename(item.file.name);
            const path = `ingest/${sanitized}`;
            await uploadFile(item.file, path);
            item.status = 'uploaded';
            item.storagePath = path;
            item.mime = item.file.type;
          } catch (e: any) {
            item.status = 'error';
            item.error = e?.message || 'Unknown error';
            toast.error(item.error);
            logEvent({ event: 'upload_error', id: item.id, error: item.error });
          }
        }
      }

      if (items.some((i) => i.status === 'error')) {
        setState('ERROR');
        setProgress(100);
        return;
      }

      const sources = [
        ...items
          .filter((n) => n.kind === 'note')
          .map((n) => ({ type: 'text', content: n.text!.trim() })),
        ...items
          .filter((u) => u.kind === 'url')
          .map((u) => ({ type: 'url', url: u.url! })),
        ...items
          .filter((f) => f.kind === 'file' && f.status === 'uploaded' && f.storagePath)
          .map((f) => ({
            type: 'file' as const,
            storage_path: f.storagePath!,
            mime: f.mime,
            size: f.size,
            title: f.name,
          })),
      ];

      const body = { basket_id: null, intent: intent || undefined, sources };
      logEvent({ event: 'submit', reqId, body });

      setState('PROCESSING');
      const res = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Req-Id': reqId },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      logEvent({ event: 'response', reqId, status: res.status, body: text.slice(0, 400) });

      if (!res.ok) {
        toast.error(text);
        setState('ERROR');
        setError(text.slice(0, 400));
        setProgress(100);
        return;
      }

      const data = JSON.parse(text || '{}');
      const id = data.basket_id || data.id;

      dlog('telemetry', { event: 'create_complete' });
      setState('COMPLETE');
      setProgress(100);

      const hold =
        typeof window !== 'undefined' &&
        new URLSearchParams(location.search).get('hold') === '1';
      if (!hold && id) router.push(`/baskets/${id}/work?focus=insights`);
    } catch (e: any) {
      console.error('❌ Basket creation failed:', e);
      toast.error(e?.message || 'Unknown error');
      setState('ERROR');
      setError(e?.message || 'Unknown error');
    }
  };

  return {
    state,
    intent,
    items,
    progress,
    error,
    setIntent: setIntentWrapper,
    addFiles,
    addUrl,
    addNote,
    removeItem,
    clearAll,
    generate,
  };
}

