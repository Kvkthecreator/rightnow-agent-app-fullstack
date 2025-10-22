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
import { ACCEPTED_FILE_TYPES, createBasketWithSeed } from '@/lib/baskets/createBasket';
import { CANONICAL_MAX_FILE_SIZE_BYTES } from '@/shared/constants/canonical_file_types';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';

export interface CreateBasketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILES = 5;

export default function CreateBasketDialog({ open, onOpenChange }: CreateBasketDialogProps) {
  const router = useRouter();
  const [basketName, setBasketName] = useState('');
  const [rawDump, setRawDump] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showAnchors, setShowAnchors] = useState(false);
  const [anchors, setAnchors] = useState({
    problem: '',
    customer: '',
    vision: '',
    metrics: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    if (!basketName.trim()) return false;
    return rawDump.trim().length > 0 || files.length > 0 || Object.values(anchors).some((value) => value.trim().length > 0);
  }, [basketName, rawDump, files, anchors]);

  const resetState = () => {
    setBasketName('');
    setRawDump('');
    setFiles([]);
    setAnchors({ problem: '', customer: '', vision: '', metrics: '' });
    setShowAnchors(false);
    setError(null);
    setSubmitting(false);
    setSuccess(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (submitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetState();
  };

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList) return;
    const remainingSlots = MAX_FILES - files.length;
    const nextFiles: File[] = [];

    Array.from(fileList)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.size > CANONICAL_MAX_FILE_SIZE_BYTES) {
          setError(`"${file.name}" exceeds the ${(CANONICAL_MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB limit.`);
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
        mode: 'upload',
        rawDump,
        files,
        anchors,
      });

      setSuccess(true);
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

  const anchorFields = (
    <div className="grid gap-4">
      <AnchorField
        label="Problem statement"
        placeholder="What pain are you solving?"
        value={anchors.problem}
        onChange={(value) => setAnchors((prev) => ({ ...prev, problem: value }))}
      />
      <AnchorField
        label="Primary customer"
        placeholder="Who feels it? Capture persona, environment, and motivation."
        value={anchors.customer}
        onChange={(value) => setAnchors((prev) => ({ ...prev, customer: value }))}
      />
      <AnchorField
        label="Vision & differentiation"
        placeholder="Why this approach wins."
        value={anchors.vision}
        onChange={(value) => setAnchors((prev) => ({ ...prev, vision: value }))}
      />
      <AnchorField
        label="Success metrics"
        placeholder="How will you measure progress?"
        optional
        value={anchors.metrics}
        onChange={(value) => setAnchors((prev) => ({ ...prev, metrics: value }))}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a basket</DialogTitle>
          <DialogDescription>
            Seed your basket with context, files, or anchors. Add whatever you already have and Yarnnn will process it through the canonical pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <FieldBlock label="Basket name" required>
              <Input
                placeholder="e.g. Acme product brain"
                value={basketName}
                onChange={(event) => setBasketName(event.target.value)}
                autoFocus
              />
            </FieldBlock>

            <FieldBlock label="Context" hint="Add any notes or pasted content you already have">
              <Textarea
                placeholder="Add any background or notes to seed the basket"
                value={rawDump}
                onChange={(event) => setRawDump(event.target.value)}
                rows={4}
              />
            </FieldBlock>

            <FieldBlock label="Attach files" hint={`Up to ${MAX_FILES} attachments · ${(CANONICAL_MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB each`}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm transition hover:border-primary hover:bg-muted/30">
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

              {files.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-border/60 bg-muted/40 px-3 py-2">
                      <span className="truncate" title={file.name}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldBlock>
          </section>

          <section className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowAnchors((prev) => !prev)}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Add structured anchors (optional)
                </div>
                <p className="text-xs text-muted-foreground">Set foundation points now so reflections and proposals have solid grounding.</p>
              </div>
              <span className="text-xs text-primary">{showAnchors ? 'Hide' : 'Show'}</span>
            </button>

            {showAnchors && <div className="mt-4 space-y-4">{anchorFields}</div>}
          </section>

          {error && (
            <div className="flex items-center gap-2 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
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

function FieldBlock({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <Label className={cn('text-sm font-medium text-slate-800', required && 'after:ml-1 after:text-destructive after:content-["*"]')}>
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function AnchorField({
  label,
  placeholder,
  value,
  onChange,
  optional,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <Label className="text-sm font-medium text-slate-800">{label}</Label>
        {optional && <span className="text-xs text-muted-foreground">Optional</span>}
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-y"
      />
    </div>
  );
}
