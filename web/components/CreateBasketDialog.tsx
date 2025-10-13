"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useCreateBasket } from '@/hooks/useCreateBasket';
import { cn } from '@/lib/utils';

export interface CreateBasketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldClasses = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function CreateBasketDialog({ open, onOpenChange }: CreateBasketDialogProps) {
  const {
    basketName,
    problemStatement,
    primaryCustomer,
    productVision,
    successMetrics,
    setBasketName,
    setProblemStatement,
    setPrimaryCustomer,
    setProductVision,
    setSuccessMetrics,
    submit,
    canSubmit,
    submitting,
    hasAnchorDraft,
  } = useCreateBasket();

  const handleClose = (nextOpen: boolean) => {
    if (submitting) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl gap-6">
        <DialogHeader>
          <DialogTitle>Create a basket</DialogTitle>
          <DialogDescription>
            Name your basket and capture the core truths behind it. Yarnnn uses these anchors to ground reflections and composed documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="basket-name">Basket name</label>
            <Input
              id="basket-name"
              autoFocus
              value={basketName}
              onChange={(event) => setBasketName(event.target.value)}
              placeholder="e.g. Acme product brain"
            />
            <p className="text-xs text-slate-500">Use something your team will recognise. You can change this later.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AnchorField
              label="Problem statement"
              placeholder="What pain are you solving?"
              value={problemStatement}
              onChange={setProblemStatement}
            />
            <AnchorField
              label="Primary customer"
              placeholder="Who feels it? Capture persona, environment, and motivation."
              value={primaryCustomer}
              onChange={setPrimaryCustomer}
            />
            <AnchorField
              label="Vision & differentiation"
              placeholder="Why this approach wins."
              value={productVision}
              onChange={setProductVision}
            />
            <AnchorField
              label="Success metrics"
              placeholder="How will you measure progress?"
              value={successMetrics}
              onChange={setSuccessMetrics}
              optional
            />
          </div>

          <p className="text-xs text-slate-500">
            You can add or refine these anchors later from the Memory view. Providing them now helps Yarnnn compose PRDs and campaigns straight away.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              await submit();
              onOpenChange(false);
            }}
            disabled={!canSubmit}
          >
            {submitting ? 'Creating…' : hasAnchorDraft ? 'Create & seed anchors' : 'Create basket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnchorField({
  label,
  placeholder,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-slate-700">{label}</label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(fieldClasses, 'min-h-[120px] resize-y')}
      />
    </div>
  );
}
