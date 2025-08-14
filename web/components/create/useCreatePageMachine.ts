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
  publicUrl?: string;
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
            const url = await uploadFile(item.file, path);
            item.status = 'uploaded';
            item.storagePath = path;
            item.publicUrl = url;
            item.mime = item.file.type;
          } catch (e: any) {
            const errMsg = e?.message || 'Unknown error';
            item.status = 'error';
            item.error = errMsg;
            toast.error(errMsg);
            logEvent({ event: 'upload_error', id: item.id, error: errMsg });
          }
        }
      }

      if (items.some((i) => i.status === 'error')) {
        setState('ERROR');
        setProgress(100);
        return;
      }

      // Consolidate text and file URLs for backend DumpPayload
      const textParts = [
        intent.trim(),
        ...items.filter((n) => n.kind === 'note').map((n) => n.text!.trim()),
        ...items.filter((u) => u.kind === 'url').map((u) => u.url!),
      ].filter(Boolean);
      const text_dump = textParts.join('\n\n');
      const file_urls = items
        .filter((f) => f.kind === 'file' && f.status === 'uploaded' && f.publicUrl)
        .map((f) => f.publicUrl!);

      const dumpBody: any = { basket_id: null, text_dump };
      if (file_urls.length) dumpBody.file_urls = file_urls;
      logEvent({ event: 'submit_dump', reqId, dumpBody });

      setState('PROCESSING');
      // eslint-disable-next-line @next/next/no-async-client-component
      const dumpRes = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Req-Id': reqId },
        credentials: 'include',
        body: JSON.stringify(dumpBody),
      });

      const dumpText = await dumpRes.text();
      logEvent({ event: 'dump_response', reqId, status: dumpRes.status, body: dumpText.slice(0, 400) });

      if (!dumpRes.ok) {
        toast.error(dumpText);
        setState('ERROR');
        setError(dumpText.slice(0, 400));
        setProgress(100);
        return;
      }

      const dumpData = JSON.parse(dumpText || '{}');
      const { basket_id: basketId } = dumpData;
      
      // Normalize response to handle both raw_dump_id and raw_dump_ids
      const dumpIds = dumpData.raw_dump_ids ?? (dumpData.raw_dump_id ? [dumpData.raw_dump_id] : []);
      if (!dumpIds.length) {
        throw new Error("No raw_dump ids returned");
      }

      // Kick off basket work using all raw dumps
      const workBody = {
        request_id: reqId,
        basket_id: basketId,
        intent: intent || undefined,
        sources: dumpIds.map(id => ({ type: 'raw_dump', id })),
      };
      logEvent({ event: 'submit_work', reqId, workBody });
      const workRes = await fetch(`/api/baskets/${basketId}/work`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Req-Id': reqId,
        },
        credentials: 'include',
        body: JSON.stringify(workBody),
      });
      const workText = await workRes.text();
      logEvent({ event: 'work_response', reqId, status: workRes.status, body: workText.slice(0, 400) });

      if (!workRes.ok) {
        toast.error(workText);
        setState('ERROR');
        setError(workText.slice(0, 400));
        setProgress(100);
        return;
      }

      dlog('telemetry', { event: 'create_complete' });
      setState('COMPLETE');
      setProgress(100);

      const hold =
        typeof window !== 'undefined' &&
        new URLSearchParams(location.search).get('hold') === '1';
      if (!hold) router.push(`/baskets/${basketId}/work?focus=insights`);
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

