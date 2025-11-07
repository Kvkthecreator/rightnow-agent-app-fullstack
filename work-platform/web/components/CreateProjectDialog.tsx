"use client";

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = '.txt,.md,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.json,.csv';

export default function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [rawDump, setRawDump] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    if (!projectName.trim()) return false;
    return rawDump.trim().length > 0 || files.length > 0;
  }, [projectName, rawDump, files]);

  const resetState = () => {
    setProjectName('');
    setRawDump('');
    setFiles([]);
    setDescription('');
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
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`"${file.name}" exceeds the ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB limit.`);
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
      const formData = new FormData();
      formData.append('project_name', projectName);
      formData.append('initial_context', rawDump);
      if (description) {
        formData.append('description', description);
      }

      // Append files
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/projects/new', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create project' }));
        throw new Error(typeof errorData.detail === 'string' ? errorData.detail : errorData.detail?.message || 'Failed to create project');
      }

      const result = await response.json();

      setSuccess(true);
      handleClose(false);
      resetState();

      // Navigate to project
      router.push(`/projects/${result.project_id}/overview`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project workspace with initial context. Your project will have a dedicated knowledge basket and workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <FieldBlock label="Project Name" required>
              <Input
                placeholder="e.g., Healthcare AI Research"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />
            </FieldBlock>

            <FieldBlock label="Initial Context" hint="Paste notes, requirements, or any context you have">
              <Textarea
                placeholder="Describe what you want to accomplish with this project..."
                value={rawDump}
                onChange={(e) => setRawDump(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </FieldBlock>

            <FieldBlock label="Files" hint={`Up to ${MAX_FILES} files · ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB each`}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm transition hover:border-primary hover:bg-muted/30">
                <Upload className="h-5 w-5" />
                <span>Drag & drop or click to browse</span>
                <span className="text-xs text-muted-foreground">.txt, .md, .pdf, .jpg, .png, .gif, .bmp, .tiff, .webp</span>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={(e) => handleFileSelection(e.target.files)}
                  disabled={files.length >= MAX_FILES}
                />
              </label>

              {files.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-border/60 bg-muted/40 px-3 py-2">
                      <span className="truncate" title={file.name}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={submitting}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldBlock>

            <FieldBlock label="Description (Optional)" hint="Brief summary visible on project cards">
              <Textarea
                placeholder="Optional project description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
                maxLength={1000}
              />
            </FieldBlock>
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
              <span>Project created successfully. Redirecting…</span>
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
              'Create Project'
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
