'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

type IngestItem =
  | { kind: 'file'; file: File; preview?: string }
  | { kind: 'text'; text: string }
  | { kind: 'url'; url: string };

export interface UnifiedIngestProps {
  onChange: (items: IngestItem[]) => void;
}

export default function UnifiedIngest({ onChange }: UnifiedIngestProps) {
  const [items, setItems] = useState<IngestItem[]>([]);
  const urlRef = useRef<HTMLInputElement>(null);

  const push = (next: IngestItem[]) => {
    setItems(prev => {
      const merged = [...prev, ...next];
      onChange(merged);
      return merged;
    });
  };

  const onDrop = useCallback((accepted: File[]) => {
    push(
      accepted.map(f => ({
        kind: 'file',
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      }))
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const blobs: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) blobs.push(file);
        }
      }
      if (blobs.length) {
        push(
          blobs.map(f => ({ kind: 'file', file: f, preview: URL.createObjectURL(f) }))
        );
      } else {
        const text = e.clipboardData?.getData('text')?.trim();
        if (text) {
          try {
            const u = new URL(text);
            push([{ kind: 'url', url: u.toString() }]);
          } catch {
            push([{ kind: 'text', text }]);
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const addUrl = () => {
    const v = urlRef.current?.value?.trim();
    if (!v) return;
    try {
      const u = new URL(v);
      push([{ kind: 'url', url: u.toString() }]);
      if (urlRef.current) urlRef.current.value = '';
    } catch {}
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Input ref={urlRef} placeholder="Paste a link and press Add" />
        <Button onClick={addUrl}>Add</Button>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-md border-2 border-dashed p-8 text-center ${isDragActive ? 'opacity-100' : 'opacity-80'}`}
      >
        <input {...getInputProps()} />
        <div>Drop files here, or paste text/screenshots anywhere</div>
      </div>

      {!!items.length && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, i) => (
            <div key={i} className="rounded border p-2 text-sm">
              {it.kind === 'file' && it.preview ? (
                <Image
                  src={it.preview}
                  alt={it.file.name}
                  width={300}
                  height={200}
                  className="rounded"
                />
              ) : (
                <div className="truncate">
                  {it.kind === 'file' && it.file.name}
                  {it.kind === 'url' && it.url}
                  {it.kind === 'text' && it.text.slice(0, 140)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export type { IngestItem };
