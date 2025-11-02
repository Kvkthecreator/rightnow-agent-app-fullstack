"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateAnchorDialogProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { label: string; expected_type: 'block' | 'context_item'; description?: string }) => Promise<void> | void;
}

export function CreateAnchorDialog({ open, submitting, onClose, onSubmit }: CreateAnchorDialogProps) {
  const [label, setLabel] = useState('');
  const [expectedType, setExpectedType] = useState<'block' | 'context_item'>('block');
  const [description, setDescription] = useState('');

  const reset = () => {
    setLabel('');
    setDescription('');
    setExpectedType('block');
  };

  const handleSubmit = async () => {
    if (!label.trim()) return;
    await onSubmit({ label: label.trim(), expected_type: expectedType, description: description.trim() || undefined });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) { if (!next) { reset(); onClose(); } } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create custom anchor</DialogTitle>
          <DialogDescription>
            Use custom anchors for basket-specific truths outside the default brain configuration. Custom anchors still route through governance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="custom-anchor-label">Anchor label</label>
            <Input
              id="custom-anchor-label"
              value={label}
              autoFocus
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expected substrate type</label>
            <Select value={expectedType} onValueChange={(value) => setExpectedType(value as 'block' | 'context_item')}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Structured knowledge (block)</SelectItem>
                <SelectItem value="context_item">Semantic meaning (context item)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="custom-anchor-description">Description (optional)</label>
            <Input
              id="custom-anchor-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="How this anchor should be used"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => { reset(); onClose(); }} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !label.trim()}>
            {submitting ? 'Creating…' : 'Create anchor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
