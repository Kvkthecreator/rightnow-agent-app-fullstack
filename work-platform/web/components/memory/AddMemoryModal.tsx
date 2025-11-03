"use client";

import { useState } from 'react';
import { AddMemoryComposer } from "@/components/basket";
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddMemoryModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemoryModal({
  basketId,
  open,
  onClose,
  onSuccess
}: AddMemoryModalProps) {
  const [processing, setProcessing] = useState(false);
  const [dumpId, setDumpId] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setProcessing(false);
    setDumpId(null);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    // Auto-close after brief delay to show completion
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl md:max-w-5xl">

        {/* Header */}
        <div className="border-b px-8 py-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Capture a Thought</h3>
            <p className="text-sm text-gray-600">
              {processing ? 'Processing your memory...' : 'Add a thought to process into knowledge'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={processing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {processing ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Memory submitted</span>
              </div>

              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-700">Extracting knowledge and finding relationships...</span>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500">
                  This usually takes 5-10 seconds. You can close this and continue working.
                </p>
              </div>
            </div>
          ) : (
            <AddMemoryComposer
              basketId={basketId}
              onSuccess={(res) => {
                setProcessing(true);
                setDumpId(res.dump_id);
                handleSuccess();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
