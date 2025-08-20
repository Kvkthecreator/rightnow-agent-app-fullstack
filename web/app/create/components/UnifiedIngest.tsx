'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/Card';

type IngestItem =
  | { kind: 'file'; file: File; preview?: string }
  | { kind: 'text'; text: string };

export interface UnifiedIngestProps {
  onChange: (items: IngestItem[]) => void;
}

export default function UnifiedIngest({ onChange }: UnifiedIngestProps) {
  const [items, setItems] = useState<IngestItem[]>([]);

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
          // All pasted text (including URLs) treated as text content
          push([{ kind: 'text', text }]);
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <Card className="p-4 space-y-4">
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
