"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, createBasketWithSeed } from '@/lib/baskets/createBasket';
import { CANONICAL_MAX_FILE_SIZE_BYTES } from '@/shared/constants/canonical_file_types';

export interface CreateBasketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BasketMode = 'upload' | 'manual';

const MAX_FILES = 5;

export default function CreateBasketDialog({ open, onOpenChange }: CreateBasketDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<BasketMode>('upload');
  const [basketName, setBasketName] = useState('');
  const [intent, setIntent] = useState('');
  const [rawDump, setRawDump] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successBasketId, setSuccessBasketId] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!basketName.trim()) return false;
    if (mode === 'upload') {
      return files.length > 0 || rawDump.trim().length > 0;
    }
    return intent.trim().length > 0 || rawDump.trim().length > 0 || files.length > 0;
  }, [basketName, intent, mode, rawDump, files]);

  const resetState = () => {
    setBasketName('');
    setIntent('');
    setRawDump('');
    setFiles([]);
    setError(null);
    setSubmitting(false);
    setSuccessBasketId(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (submitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList) return;

    const nextFiles: File[] = [];
    const remainingSlots = MAX_FILES - files.length;

    Array.from(fileList)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.size > CANONICAL_MAX_FILE_SIZE_BYTES) {
          setError(`"${file.name}" exceeds the ${CANONICAL_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit.`);
          return;
        }
        nextFiles.push(file);
      });

    if (nextFiles.length > 0) {
      setFiles((prev) => [...prev, ...nextFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await createBasketWithSeed({
        name: basketName,
        mode,
        intent,
        rawDump,
        files,
      });

      setSuccessBasketId(result.basketId);
      onOpenChange(false);
      resetState();
      router.push(`${result.nextUrl}?onboarded=1`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create basket';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const FileList = () => (
    <ul className="space-y-2">
      {files.map((file, index) => (
        <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
          <span className="truncate" title={file.name}>
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );

  const ModeSelector = () => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={mode === 'upload' ? 'default' : 'outline'}
        onClick={() => setMode('upload')}
      >
        Use existing files
      </Button>
      <Button
        type="button"
        variant={mode === 'manual' ? 'default' : 'outline'}
        onClick={() => setMode('manual')}
      >
        Manual wizard
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a basket</DialogTitle>
          <DialogDescription>
            Choose how you want to seed your new basket. Files are limited to {MAX_FILES} attachments ({CANONICAL_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB each).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <ModeSelector />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="basket-name">Basket name</Label>
              <Input
                id="basket-name"
                placeholder="e.g. Acme product brain"
                value={basketName}
                onChange={(event) => setBasketName(event.target.value)}
                autoFocus
              />
            </div>

            {mode === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="basket-intent">Intent</Label>
                <Input
                  id="basket-intent"
                  placeholder="What problem or goal defines this basket?"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="basket-raw-dump">Context (optional)</Label>
              <Textarea
                id="basket-raw-dump"
                placeholder="Add any background or notes to seed the basket"
                value={rawDump}
                onChange={(event) => setRawDump(event.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Attach files (optional)</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm hover:border-primary">
                <Upload className="h-5 w-5" />
                <span>Drag & drop or click to browse</span>
                <span className="text-xs text-muted-foreground">Accepted: {ACCEPTED_FILE_TYPES}</span>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={(event) => handleFileSelection(event.target.files)}
                />
              </label>

              {files.length > 0 && <FileList />}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {successBasketId && (
            <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Basket created successfully. Redirecting…</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </span>
            ) : (
              'Create basket'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
