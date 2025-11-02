"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from './WizardProgress';
import { WizardStep } from './WizardStep';
import { Card } from '@/components/ui/Card';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { UploadComparison } from './UploadComparison';

interface UploadWizardProps {
  basketId: string;
  basketName?: string;
  maxDocuments: number;
  transformationMessage: string;
}

type UploadedFile = {
  file: File;
  content: string;
  rawDumpId?: string;
  status: 'pending' | 'uploading' | 'extracting' | 'completed' | 'error';
  error?: string;
};

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'extract', label: 'Extract' },
  { id: 'review', label: 'Review' },
  { id: 'compare', label: 'Compare' },
  { id: 'complete', label: 'Complete' },
];

export function UploadWizard({
  basketId,
  basketName = 'your basket',
  maxDocuments,
  transformationMessage,
}: UploadWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError('');

      const droppedFiles = Array.from(e.dataTransfer.files);

      if (files.length + droppedFiles.length > maxDocuments) {
        setError(`Maximum ${maxDocuments} documents allowed`);
        return;
      }

      // Filter for supported formats
      const supportedFiles = droppedFiles.filter((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext || '');
      });

      if (supportedFiles.length !== droppedFiles.length) {
        setError('Some files were skipped. Only .txt, .md, .pdf, .doc, .docx supported');
      }

      // Read file contents
      const newFiles: UploadedFile[] = await Promise.all(
        supportedFiles.map(async (file) => {
          const content = await file.text();
          return {
            file,
            content,
            status: 'pending' as const,
          };
        })
      );

      setFiles([...files, ...newFiles]);
    },
    [files, maxDocuments]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);

      if (files.length + selectedFiles.length > maxDocuments) {
        setError(`Maximum ${maxDocuments} documents allowed`);
        return;
      }

      const newFiles: UploadedFile[] = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await file.text();
          return {
            file,
            content,
            status: 'pending' as const,
          };
        })
      );

      setFiles([...files, ...newFiles]);
    },
    [files, maxDocuments]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  }, [files]);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Upload files one by one
      const updatedFiles = [...files];

      for (let i = 0; i < updatedFiles.length; i++) {
        updatedFiles[i].status = 'uploading';
        setFiles([...updatedFiles]);

        const response = await fetch(`/api/baskets/${basketId}/upload-wizard/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: updatedFiles[i].file.name,
            content: updatedFiles[i].content,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = error.error || 'Upload failed';
          setFiles([...updatedFiles]);
          continue;
        }

        const result = await response.json();
        updatedFiles[i].rawDumpId = result.raw_dump_id;
        updatedFiles[i].status = 'extracting';
        setFiles([...updatedFiles]);
      }

      // Move to extraction step
      setCurrentStep(1);
      pollExtractionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  }, [basketId, files]);

  const pollExtractionStatus = useCallback(async () => {
    const interval = setInterval(async () => {
      const updatedFiles = [...files];
      let allCompleted = true;

      for (const file of updatedFiles) {
        if (file.status === 'extracting' && file.rawDumpId) {
          const response = await fetch(
            `/api/baskets/${basketId}/upload-wizard/status?raw_dump_id=${file.rawDumpId}`
          );

          if (response.ok) {
            const { status } = await response.json();
            if (status === 'completed') {
              file.status = 'completed';
            } else if (status === 'error') {
              file.status = 'error';
              file.error = 'Extraction failed';
            } else {
              allCompleted = false;
            }
          }
        } else if (file.status === 'extracting') {
          allCompleted = false;
        }
      }

      setFiles([...updatedFiles]);

      if (allCompleted) {
        clearInterval(interval);
        setCurrentStep(2);
      }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  }, [basketId, files]);

  const handleContinueToComparison = () => {
    setCurrentStep(3);
  };

  const handleComplete = () => {
    router.push(`/baskets/${basketId}/building-blocks?upload_complete=1`);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Upload Existing Documents
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900">{transformationMessage}</p>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-700 mb-2">
          Drag and drop files here, or{' '}
          <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer underline">
            browse
            <input
              type="file"
              multiple
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-slate-500">
          Supports .txt, .md, .pdf, .doc, .docx (max {maxDocuments} files)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Uploaded Files ({files.length}/{maxDocuments})
          </p>
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(i)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );

  const renderExtractionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Extracting Substrate
        </h2>
        <p className="text-slate-600">
          YARNNN is analyzing your documents and extracting reusable knowledge...
        </p>
      </div>

      <div className="space-y-3">
        {files.map((file, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {file.file.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {file.status === 'uploading' && 'Uploading...'}
                  {file.status === 'extracting' && 'Extracting substrate...'}
                  {file.status === 'completed' && 'Complete'}
                  {file.status === 'error' && file.error}
                </p>
              </div>
            </div>
            {file.status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {file.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            {(file.status === 'uploading' || file.status === 'extracting') && (
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Extraction Complete
        </h2>
        <p className="text-slate-600">
          Your documents have been transformed into renewable substrate.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Substrate extracted from {files.length} document
              {files.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-green-700 mt-1">
              You can now review substrate proposals and see how YARNNN composes
              your documents
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              Next: Compare original vs. YARNNN-composed versions
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              See how your documents are transformed into renewable knowledge
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComparisonStep = () => {
    const completedFiles = files.filter((f) => f.status === 'completed');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Transformation Preview
          </h2>
          <p className="text-slate-600">
            See how YARNNN transforms your documents into renewable knowledge
          </p>
        </div>

        {completedFiles.length > 0 && completedFiles[0].rawDumpId ? (
          <UploadComparison
            basketId={basketId}
            rawDumpId={completedFiles[0].rawDumpId}
            fileName={completedFiles[0].file.name}
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              No completed documents available for comparison
            </p>
          </div>
        )}

        {completedFiles.length > 1 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              Showing preview for first document. All {completedFiles.length}{' '}
              documents will be available in Building Blocks.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Upload Complete!
        </h2>
        <p className="text-slate-600">
          Your documents have been transformed into renewable substrate for{' '}
          {basketName}
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
        <p className="text-sm font-medium text-indigo-900 mb-2">What's next?</p>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• Review and approve substrate proposals</li>
          <li>• See your documents composed from renewable knowledge</li>
          <li>• Continue building your product brain</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Upload className="h-6 w-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Upload Wizard
            </h1>
          </div>
          <p className="text-slate-600">
            Transform existing documents into renewable knowledge
          </p>
        </div>

        <WizardProgress
          currentStep={currentStep}
          totalSteps={STEPS.length}
          labels={STEPS.map((s) => s.label)}
        />

        <Card className="p-8 shadow-lg">
          <WizardStep
            onNext={
              currentStep === 0
                ? handleUpload
                : currentStep === 2
                ? handleContinueToComparison
                : currentStep === 3
                ? () => setCurrentStep(4)
                : currentStep === 4
                ? handleComplete
                : undefined
            }
            onBack={currentStep > 0 && currentStep !== 1 ? () => setCurrentStep(currentStep - 1) : undefined}
            nextDisabled={
              (currentStep === 0 && files.length === 0) ||
              (currentStep === 1) ||
              isProcessing
            }
            nextLabel={
              currentStep === 0
                ? 'Upload & Extract'
                : currentStep === 2
                ? 'Continue to Comparison'
                : currentStep === 3
                ? 'Continue'
                : currentStep === 4
                ? 'Go to Building Blocks'
                : 'Next'
            }
            showBack={currentStep > 0 && currentStep !== 1 && currentStep !== 4}
            showNext={currentStep !== 1}
            isLoading={isProcessing || currentStep === 1}
          >
            {currentStep === 0 && renderUploadStep()}
            {currentStep === 1 && renderExtractionStep()}
            {currentStep === 2 && renderReviewStep()}
            {currentStep === 3 && renderComparisonStep()}
            {currentStep === 4 && renderCompleteStep()}
          </WizardStep>
        </Card>
      </div>
    </div>
  );
}
