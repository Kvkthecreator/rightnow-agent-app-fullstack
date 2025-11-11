'use client';

import { useState } from 'react';
import { X, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddContextComposer } from './AddContextComposer';

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  basketId: string;
  onSuccess?: () => void;
}

export function AddContextModal({
  isOpen,
  onClose,
  projectId,
  basketId,
  onSuccess,
}: AddContextModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    'submitting' | 'processing' | 'complete'
  >('submitting');

  const handleSubmit = async (data: {
    text?: string;
    files?: File[];
  }) => {
    setIsProcessing(true);
    setProcessingStep('submitting');

    try {
      // Submit to work-platform BFF API, which delegates to substrate-api
      const formData = new FormData();
      formData.append('basket_id', basketId);
      formData.append('project_id', projectId);

      if (data.text) {
        formData.append('text_dump', data.text);
      }

      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Generate client-side metadata
      const dumpRequestId = crypto.randomUUID();
      const ingestTraceId = crypto.randomUUID();
      const meta = {
        client_ts: new Date().toISOString(),
        ingest_trace_id: ingestTraceId,
      };

      formData.append('dump_request_id', dumpRequestId);
      formData.append('meta', JSON.stringify(meta));

      setProcessingStep('processing');

      const response = await fetch(`/api/projects/${projectId}/context`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add context');
      }

      const result = await response.json();

      setProcessingStep('complete');

      // Auto-close after showing success
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('submitting');
        onClose();
        onSuccess?.();
      }, 2000);

      return result;
    } catch (error) {
      setIsProcessing(false);
      setProcessingStep('submitting');
      throw error;
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Context</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isProcessing ? (
          <ProcessingState step={processingStep} />
        ) : (
          <AddContextComposer
            basketId={basketId}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProcessingState({
  step,
}: {
  step: 'submitting' | 'processing' | 'complete';
}) {
  return (
    <div className="space-y-6 py-8">
      {/* Submitting */}
      <div className="flex items-start gap-3">
        {step === 'submitting' ? (
          <Clock className="h-5 w-5 text-blue-600 animate-pulse mt-0.5" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        )}
        <div>
          <p className="font-medium text-slate-900">Context submitted</p>
          <p className="text-sm text-slate-600">Sending to substrate-api...</p>
        </div>
      </div>

      {/* Processing */}
      <div className="flex items-start gap-3">
        {step === 'processing' ? (
          <Clock className="h-5 w-5 text-blue-600 animate-pulse mt-0.5" />
        ) : step === 'complete' ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5" />
        )}
        <div>
          <p className="font-medium text-slate-900">
            Extracting knowledge and meaning
          </p>
          <p className="text-sm text-slate-600">
            P0-P4 pipeline processing (5-10 seconds)
          </p>
        </div>
      </div>

      {/* Complete */}
      {step === 'complete' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">
                Context added successfully
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your context has been captured and will appear shortly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
