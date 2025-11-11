'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Upload, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface AddContextComposerProps {
  basketId: string;
  onSubmit: (data: { text?: string; files?: File[] }) => Promise<void>;
  onCancel: () => void;
}

export function AddContextComposer({
  basketId,
  onSubmit,
  onCancel,
}: AddContextComposerProps) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = text.trim().length > 0 || files.length > 0;

  const handleSubmit = async () => {
    if (!hasContent || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        text: text.trim() || undefined,
        files: files.length > 0 ? files : undefined,
      });

      // Reset form on success
      setText('');
      setFiles([]);
    } catch (error) {
      console.error('Failed to submit context:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to add context. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setText('');
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add knowledge, insights, or context for this project..."
          className="min-h-[120px] max-h-[200px] resize-y"
          disabled={isSubmitting}
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-xs">
            ⌘↵
          </kbd>{' '}
          or{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-xs">
            Ctrl+Enter
          </kbd>{' '}
          to submit
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">
            Drag and drop images here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isSubmitting}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Images will be processed by the P0-P4 pipeline
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isSubmitting}
        />
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Selected files ({files.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group border border-slate-200 rounded-lg p-2 bg-white"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700 truncate flex-1">
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isSubmitting}
                  >
                    <X className="h-3.5 w-3.5 text-slate-500 hover:text-red-600" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <ImageIcon className="h-4 w-4 mr-1.5" />
            Add Images
          </Button>

          {hasContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Adding...
              </>
            ) : (
              'Add Context'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
