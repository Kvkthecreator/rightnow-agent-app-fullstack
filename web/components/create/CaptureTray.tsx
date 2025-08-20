'use client';

import { useEffect, useRef, useState } from 'react';
import { IntentField } from '@/app/create/components/IntentField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { UploadArea } from '@/components/ui/UploadArea';
import { Label } from '@/components/ui/Label';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import type { AddedItem, CreateState } from './useCreatePageMachine';
import { AddedItemRow } from './AddedItemRow';

interface Props {
  intent: string;
  items: AddedItem[];
  state: CreateState;
  progress: number;
  onIntent: (v: string) => void;
  addFiles: (files: File[]) => void;
  addUploadedFile: (file: File, url: string) => void;
  addNote: (text: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  generate: () => void;
}

export function CaptureTray({
  intent,
  items,
  state,
  progress,
  onIntent,
  addFiles,
  addUploadedFile,
  addNote,
  removeItem,
  clearAll,
  generate,
}: Props) {
  const [note, setNote] = useState('');

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
          // All pasted text (including URLs) treated as notes
          addNote(text);
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, addNote]);


  const handleAddNote = () => {
    if (!note.trim()) return;
    addNote(note.trim());
    setNote('');
  };

  const counts = {
    file: items.filter((i) => i.kind === 'file').length,
    note: items.filter((i) => i.kind === 'note').length,
  };

  const total = items.length;
  const hasErrors = items.some((i) => i.status === 'error');
  const isCreating = !['EMPTY', 'COLLECTING', 'COMPLETE', 'ERROR'].includes(state);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Intent</CardTitle>
        </CardHeader>
        <CardContent>
          <IntentField value={intent} onChange={onIntent} />
          <p className="text-sm text-gray-500 mt-1">
            We’ll name it after your first item. You can edit later.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadArea
            prefix="ingest"
            maxFiles={10}
            enableDrop
            showPreviewGrid
            internalDragState
            onUpload={(url, file) => addUploadedFile(file, url)}
          />
        </CardContent>
      </Card>


      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <div className="flex items-start gap-2">
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a note"
              className="h-24"
            />
            <Button onClick={handleAddNote}>Add note</Button>
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Added items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.map((it) => (
              <AddedItemRow key={it.id} item={it} onRemove={removeItem} />
            ))}
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <ProgressStepper
          current={Math.min(4, Math.floor(progress / 25) + 1)}
          steps={["Uploading", "Parsing", "Dumps", "Scaffolding"]}
        />
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {total} added • {counts.file} file{counts.file === 1 ? '' : 's'}, {counts.note} note{counts.note === 1 ? '' : 's'}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={clearAll} disabled={(total === 0 && !intent) || isCreating}>
            Clear All
          </Button>
          <Button onClick={generate} disabled={(total === 0 && intent.trim() === '') || hasErrors || isCreating}>
            Create
          </Button>
        </div>
      </div>
      {hasErrors && (
        <div className="text-sm text-red-600">Resolve errors above before generating.</div>
      )}
    </div>
  );
}

