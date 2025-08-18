'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/uploadFile';
import { sanitizeFilename } from '@/lib/utils/sanitizeFilename';
import { dlog } from '@/lib/dev/log';
import { toast } from 'react-hot-toast';
import type { CreateBasketReq, CreateBasketRes } from '@shared/contracts/baskets';
import type { CreateDumpReq, CreateDumpRes } from '@shared/contracts/dumps';

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
  const isGeneratingRef = useRef(false);

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

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null as any;
    }
  }

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

  const addUploadedFile = (file: File, url: string) => {
    const newItem: AddedItem = {
      id: crypto.randomUUID(),
      kind: 'file',
      name: file.name,
      size: file.size,
      status: 'uploaded',
      publicUrl: url,
      mime: file.type,
    };
    const merged = [...items, newItem];
    setItems(merged);
    recompute(intent, merged);
    dlog('telemetry', { event: 'create_added_item', type: 'file_uploaded' });
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
    if (isGeneratingRef.current) return;
    
    // In-flight guard - single guarded entry point
    isGeneratingRef.current = true;

    dlog('telemetry', { event: 'create_generate_clicked' });
    setState('SUBMITTED');
    setProgress(5);
    
    try {
      const reqId = `ui-${Date.now()}`;

      // Upload all files first
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

      // Generate UUID idempotency keys per spec
      const idempotency_key = crypto.randomUUID();

      // 1) Create basket with idempotency (spec v0.1.0 compliant)
      logStep('before basket create', { idempotency_key });
      const basketReq: CreateBasketReq = {
        idempotency_key,
        intent: intent.trim(),
        raw_dump: { text: '', file_urls: [] },
        notes: [],
      };
      
      const basketRes = await fetch('/api/baskets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(basketReq),
      });
      
      if (!basketRes.ok) {
        const err = await safeJson(basketRes);
        throw new Error(`Basket create failed: ${basketRes.status} ${JSON.stringify(err)}`);
      }
      
      const basketResult: CreateBasketRes = await safeJson(basketRes);
      const basketId = (basketResult as any).id || (basketResult as any).basket_id;
      logStep('after basket create', { basketId });
      
      if (!basketId) {
        throw new Error('Create flow invariant violated: basket_id missing');
      }

      setState('PROCESSING');
      
      // 2) Fan-out: Create separate dump per file + one for text content
      const dumpPromises: Promise<CreateDumpRes>[] = [];
      
      // Text dump (intent + notes + URLs)
      const textParts = [
        intent.trim(),
        ...items.filter((n) => n.kind === 'note').map((n) => n.text!.trim()),
        ...items.filter((u) => u.kind === 'url').map((u) => u.url!),
      ].filter(Boolean);
      
      if (textParts.length > 0) {
        const textDumpReq: CreateDumpReq = {
          basket_id: basketId,
          dump_request_id: crypto.randomUUID(),
          text_dump: textParts.join('\n\n'),
          meta: { source: 'text_input', type: 'combined' }
        };
        
        dumpPromises.push(
          fetch('/api/dumps/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Req-Id': reqId },
            credentials: 'include',
            body: JSON.stringify(textDumpReq),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await safeJson(res);
              throw new Error(`Text dump failed: ${res.status} ${JSON.stringify(err)}`);
            }
            return await res.json();
          })
        );
      }
      
      // File dumps (one per file)
      items
        .filter((f) => f.kind === 'file' && f.status === 'uploaded' && f.publicUrl)
        .forEach((fileItem) => {
          const fileDumpReq: CreateDumpReq = {
            basket_id: basketId,
            dump_request_id: crypto.randomUUID(),
            file_url: fileItem.publicUrl!,
            meta: { 
              source: 'file_upload', 
              filename: fileItem.name,
              mime: fileItem.mime,
              size: fileItem.size 
            }
          };
          
          dumpPromises.push(
            fetch('/api/dumps/new', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Req-Id': reqId },
              credentials: 'include',
              body: JSON.stringify(fileDumpReq),
            }).then(async (res) => {
              if (!res.ok) {
                const err = await safeJson(res);
                throw new Error(`File dump failed for ${fileItem.name}: ${res.status} ${JSON.stringify(err)}`);
              }
              return await res.json();
            })
          );
        });

      // Validate we have some content before sending
      if (dumpPromises.length === 0) {
        toast.error('Please add some content (text, notes, or files) before generating');
        setState('COLLECTING');
        setProgress(0);
        return;
      }

      // Wait for all dumps to complete
      const dumpResults = await Promise.all(dumpPromises);
      const dumpIds = dumpResults.map(result => result.dump_id);
      
      logStep('dumps created', { dumpIds });
      logEvent({ event: 'dumps_created', reqId, dumpIds, count: dumpIds.length });

      // 3) Kick off basket work using all raw dumps with init_build mode
      const workBody = {
        mode: 'init_build',
        sources: dumpIds.map((id: string) => ({ type: 'raw_dump' as const, id })),
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
      logStep('before work post', { basketId, workBody });
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
      if (!hold) router.push(`/baskets/${basketId}/dashboard`);
    } catch (e: any) {
      console.error('❌ Basket creation failed:', e);
      toast.error(e?.message || 'Unknown error');
      setState('ERROR');
      setError(e?.message || 'Unknown error');
    } finally {
      isGeneratingRef.current = false;
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
    addUploadedFile,
    addUrl,
    addNote,
    removeItem,
    clearAll,
    generate,
  };
}

