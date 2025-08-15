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

  // Debug helper (no-op unless window.YARNNN_DEBUG = true)
  const DBG =
    typeof window !== 'undefined' && (window as any).YARNNN_DEBUG === true;
  function logStep(step: string, data?: any) {
    if (!DBG) return;
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[CREATE FLOW] ${step}`);
    if (data) console.log(data);
    console.groupEnd();
  }

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

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
    // Don't add empty or whitespace-only notes
    if (!text.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    
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

      // Validate we have some content before sending
      if (!text_dump && file_urls.length === 0) {
        toast.error('Please add some content (text, notes, or files) before generating');
        setState('COLLECTING');
        setProgress(0);
        return;
      }

      // 1) Create basket first
      logStep('before basket create', { name: 'Untitled Basket' });
      const basketRes = await fetch('/api/baskets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'Untitled Basket' }),
      });
      if (!basketRes.ok) {
        const err = await safeJson(basketRes);
        throw new Error(`Basket create failed: ${basketRes.status} ${JSON.stringify(err)}`);
      }
      const basket = await basketRes.json();
      const basketId: string | undefined = basket?.id;
      logStep('after basket create', { basketId });
      if (!basketId || typeof basketId !== 'string') {
        throw new Error('Create flow invariant violated: basketId missing before dump creation');
      }

      // 2) Post dumps with a real basket_id
      const dumpBody: { basket_id: string; text_dump: string; file_urls?: string[] } = {
        basket_id: basketId,
        text_dump,
        ...(file_urls?.length ? { file_urls } : {}),
      };
      logStep('before dump create', dumpBody);
      logEvent({ event: 'submit_dump', reqId, dumpBody });
      setState('PROCESSING');
      // eslint-disable-next-line @next/next/no-async-client-component
      const dumpRes = await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Req-Id': reqId },
        credentials: 'include',
        body: JSON.stringify(dumpBody),
      });

      const dumpData = await dumpRes.json();
      logStep('dump response', { status: dumpRes.status, dumpData });
      logEvent({
        event: 'dump_response',
        reqId,
        status: dumpRes.status,
        body: JSON.stringify(dumpData).slice(0, 400),
      });
      if (!dumpRes.ok) {
        throw new Error(`Dump create failed: ${dumpRes.status} ${JSON.stringify(dumpData)}`);
      }
      const createdBasketId: string = dumpData?.basket_id ?? basketId;

      // Normalize response to handle both raw_dump_id and raw_dump_ids
      const dumpIds = dumpData.raw_dump_ids ?? (dumpData.raw_dump_id ? [dumpData.raw_dump_id] : []);
      if (!dumpIds.length) {
        throw new Error('No raw_dump ids returned');
      }

      // Kick off basket work using all raw dumps with init_build mode
      const workBody = {
        mode: 'init_build',
        sources: dumpIds.map((id: string) => ({ type: 'raw_dump', id })),
        policy: {
          allow_structural_changes: true,
          preserve_blocks: [],
          update_document_ids: [],
          strict_link_provenance: true,
        },
        options: {
          fast: false,
          max_tokens: 8000,
          trace_req_id: reqId,
        },
      };
      logStep('before work post', { createdBasketId, workBody });
      logEvent({ event: 'submit_work', reqId, workBody });
      const workRes = await fetch(`/api/baskets/${createdBasketId}/work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Req-Id': reqId,
        },
        credentials: 'include',
        body: JSON.stringify(workBody),
      });
      const workText = await workRes.text();
      logStep('work response', { status: workRes.status });
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
      if (!hold) router.push(`/baskets/${createdBasketId}/work?focus=insights`);
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

