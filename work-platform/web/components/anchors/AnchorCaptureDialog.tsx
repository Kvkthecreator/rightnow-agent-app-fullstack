"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { AnchorStatusSummary } from '@/lib/anchors/types';

interface AnchorCaptureDialogProps {
  anchor: AnchorStatusSummary | null;
  open: boolean;
  submitting: boolean;
  onSubmit: (payload: { anchor_id: string; title?: string; content: string }) => Promise<void> | void;
  onClose: () => void;
}

export function AnchorCaptureDialog({ anchor, open, submitting, onSubmit, onClose }: AnchorCaptureDialogProps) {
  const [title, setTitle] = useState(anchor?.linked_substrate?.title ?? anchor?.label ?? '');
  const [content, setContent] = useState(anchor?.linked_substrate?.content_snippet ?? '');

  useEffect(() => {
    setTitle(anchor?.linked_substrate?.title ?? anchor?.label ?? '');
    setContent(anchor?.linked_substrate?.content_snippet ?? '');
  }, [anchor?.anchor_key, anchor?.linked_substrate?.title, anchor?.linked_substrate?.content_snippet, anchor?.label]);

  const resetAndClose = () => {
    setTitle(anchor?.linked_substrate?.title ?? anchor?.label ?? '');
    setContent(anchor?.linked_substrate?.content_snippet ?? '');
    onClose();
  };

  const handleSubmit = async () => {
    if (!anchor) return;
    const trimmed = content.trim();
    if (!trimmed.length) return;
    await onSubmit({ anchor_id: anchor.anchor_key, title: title.trim() ? title.trim() : anchor.label, content: trimmed });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) { if (!next) resetAndClose(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{anchor ? `Capture ${anchor.label}` : 'Capture anchor'}</DialogTitle>
          <DialogDescription>
            Anchors store the canonical truth for this basket. Provide concise, high-signal content so downstream artefacts stay accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="anchor-title">Title</label>
            <Input
              id="anchor-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Anchor title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="anchor-content">Canonical content</label>
            <Textarea
              id="anchor-content"
              className="min-h-[200px]"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Describe the canonical truth for this anchor."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !content.trim().length}>
            {submitting ? 'Saving…' : 'Save anchor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
