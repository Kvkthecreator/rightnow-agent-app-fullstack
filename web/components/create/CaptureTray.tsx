'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IntentField } from '@/app/create/components/IntentField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AddedItem } from './useCreatePageMachine';
import { AddedItemRow } from './AddedItemRow';

interface Props {
  intent: string;
  items: AddedItem[];
  onIntent: (v: string) => void;
  addFiles: (files: File[]) => void;
  addUrl: (url: string) => void;
  addNote: (text: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  generate: () => void;
}

export function CaptureTray({
  intent,
  items,
  onIntent,
  addFiles,
  addUrl,
  addNote,
  removeItem,
  clearAll,
  generate,
}: Props) {
  const urlRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');

  const onDrop = useCallback(
    (accepted: File[]) => {
      addFiles(accepted);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        addFiles(files);
      } else {
        const text = e.clipboardData?.getData('text')?.trim();
        if (text) {
          try {
            const u = new URL(text);
            addUrl(u.toString());
          } catch {
            addNote(text);
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, addUrl, addNote]);

  const handleAddUrl = () => {
    const v = urlRef.current?.value?.trim();
    if (!v) return;
    try {
      const u = new URL(v);
      addUrl(u.toString());
      if (urlRef.current) urlRef.current.value = '';
    } catch {
      /* noop */
    }
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNote(note.trim());
    setNote('');
  };

  const counts = {
    file: items.filter((i) => i.kind === 'file').length,
    url: items.filter((i) => i.kind === 'url').length,
    note: items.filter((i) => i.kind === 'note').length,
  };

  const total = items.length;
  const hasErrors = items.some((i) => i.status === 'error');

  return (
    <div className="space-y-4">
      <div>
        <IntentField value={intent} onChange={onIntent} />
        <p className="text-sm text-gray-500 mt-1">
          Drop files, links, or notes. We’ll organize them into a starter basket.
        </p>
      </div>

      <div {...getRootProps()} className={`rounded border-2 border-dashed p-6 text-center ${isDragActive ? 'opacity-100' : 'opacity-80'}`}>
        <input {...getInputProps()} />
        <div>Drop files here, or paste text/screenshots anywhere</div>
      </div>

      <div className="flex items-center gap-2">
        <Input ref={urlRef} placeholder="Paste a link" onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()} />
        <Button onClick={handleAddUrl}>Add link</Button>
      </div>

      <div className="flex items-start gap-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note"
          className="h-24"
        />
        <Button onClick={handleAddNote}>Add note</Button>
      </div>

      {total > 0 && (
        <div className="border rounded p-2">
          {items.map((it) => (
            <AddedItemRow key={it.id} item={it} onRemove={removeItem} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {total} added • {counts.file} file{counts.file === 1 ? '' : 's'}, {counts.url} link{counts.url === 1 ? '' : 's'}, {counts.note} note{counts.note === 1 ? '' : 's'}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={clearAll} disabled={total === 0 && !intent}>
            Clear All
          </Button>
          <Button onClick={generate} disabled={(total === 0 && intent.trim() === '') || hasErrors}>
            Generate Basket
          </Button>
        </div>
      </div>
      {hasErrors && (
        <div className="text-sm text-red-600">Resolve errors above before generating.</div>
      )}
    </div>
  );
}

