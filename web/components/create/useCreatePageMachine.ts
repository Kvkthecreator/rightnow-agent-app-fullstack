'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { uploadFile } from '@/lib/uploadFile';
import { sanitizeFilename } from '@/lib/utils/sanitizeFilename';
import { dlog } from '@/lib/dev/log';

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
}

export function useCreatePageMachine() {
  const router = useRouter();
  const [state, setState] = useState<CreateState>('EMPTY');
  const [intent, setIntent] = useState('');
  const [items, setItems] = useState<AddedItem[]>([]);
  const [progress, setProgress] = useState(0);

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
      const basket = await apiClient.request<{ id: string }>(
        '/api/baskets',
        {
          method: 'POST',
          body: JSON.stringify({
            name: intent || items[0]?.name || 'New Basket',
            description: intent,
            status: 'INIT',
          }),
        }
      );

      setState('PROCESSING');

      const results = await Promise.all(
        items.map(async (item) => {
          try {
            if (item.kind === 'file' && item.file) {
              item.status = 'uploading';
              const sanitized = sanitizeFilename(item.file.name);
              const url = await uploadFile(
                item.file,
                `ingest/${sanitized}`
              );
              item.status = 'uploaded';
              await apiClient.request('/api/dumps/new', {
                method: 'POST',
                body: JSON.stringify({
                  basket_id: basket.id,
                  text_dump: item.name,
                  file_urls: [url],
                }),
              });
              item.status = 'parsed';
            } else if (item.kind === 'url') {
              await apiClient.request('/api/dumps/new', {
                method: 'POST',
                body: JSON.stringify({
                  basket_id: basket.id,
                  text_dump: item.url,
                }),
              });
              item.status = 'fetched';
            } else if (item.kind === 'note') {
              await apiClient.request('/api/dumps/new', {
                method: 'POST',
                body: JSON.stringify({
                  basket_id: basket.id,
                  text_dump: item.text,
                }),
              });
              item.status = 'ready';
            }
            return { ok: true };
          } catch (e: any) {
            item.status = 'error';
            item.error = e?.message || 'Unknown error';
            return { ok: false };
          }
        })
      );

      const anyFail = results.some((r) => !r.ok);
      setState(anyFail ? 'PROCESSING_WITH_WARNINGS' : 'PROCESSING');
      setProgress(95);

      dlog('telemetry', { event: 'create_complete' });

      setState(anyFail ? 'PROCESSING_WITH_WARNINGS' : 'COMPLETE');
      setProgress(100);

      router.push(`/baskets/${basket.id}/work`);
    } catch (e) {
      console.error('❌ Basket creation failed:', e);
      setState('ERROR');
    }
  };

  return {
    state,
    intent,
    items,
    progress,
    setIntent: setIntentWrapper,
    addFiles,
    addUrl,
    addNote,
    removeItem,
    clearAll,
    generate,
  };
}

