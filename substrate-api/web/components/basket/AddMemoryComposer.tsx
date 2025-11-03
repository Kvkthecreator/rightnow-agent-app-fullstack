"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Trash, Upload, Plus, Send, Image } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { notificationAPI } from "@/lib/api/notifications";

export interface AddMemoryComposerProps {
  basketId: string;
  disabled?: boolean;
  onSuccess?: (result: any) => void;
}

export default function AddMemoryComposer({ basketId, disabled, onSuccess }: AddMemoryComposerProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    noClick: true
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) {
      return;
    }

    try {
      setSubmitting(true);

      if (images.length > 0) {
        // Handle file uploads
        const formData = new FormData();
        formData.append('basket_id', basketId);
        formData.append('text_dump', trimmed);
        formData.append('dump_request_id', crypto.randomUUID());
        formData.append('meta', JSON.stringify({
          client_ts: new Date().toISOString(),
          ingest_trace_id: crypto.randomUUID(),
        }));

        images.forEach(file => {
          formData.append('files', file);
        });

        const res = await fetch('/api/dumps/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const dump = await res.json();
          console.log("Upload response:", dump);
          onSuccess?.(dump);
          setText("");
          setImages([]);

          // No notification here - modal will show processing status
          console.log(`Memory with files submitted: ${dump.dump_id || dump.proposal_id}`);
        } else {
          console.error("Failed to upload", await res.text());
          await notificationAPI.emitActionResult(
            'memory.error',
            'Failed to upload files',
            { severity: 'error' }
          );
        }
      } else {
        // Handle text-only submission
        const res = await fetch('/api/dumps/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            basket_id: basketId,
            text_dump: trimmed,
            dump_request_id: crypto.randomUUID(),
            meta: {
              client_ts: new Date().toISOString(),
              ingest_trace_id: crypto.randomUUID(),
            },
          }),
        });

        if (res.ok) {
          const dump = await res.json();
          console.log("Dump response:", dump);
          onSuccess?.(dump);
          setText("");

          // No notification here - modal will show processing status
          console.log(`Memory submitted (${dump.route}): ${dump.dump_id || dump.proposal_id}`);

          // Backend will handle job progress and completion notifications
        } else {
          console.error("Failed to create dump", await res.text());
          await notificationAPI.emitActionResult(
            'memory.error',
            'Failed to submit memory',
            { severity: 'error' }
          );
        }
      }
    } catch (error) {
      console.error("Error submitting:", error);
      await notificationAPI.emitActionResult(
        'memory.error',
        'Error submitting memory',
        { severity: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(60, Math.min(textarea.scrollHeight, 200))}px`;
    }
  }, [text]);

  const hasContent = text.trim() || images.length > 0;

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        isDragActive 
          ? 'border-blue-400 bg-blue-50' 
          : hasContent 
            ? 'border-gray-300 bg-white' 
            : 'border-gray-200 bg-gray-50'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          placeholder={isDragActive ? "Drop images here..." : "Add your thoughts, insights, or observations..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting || disabled}
          className="resize-none min-h-[60px] max-h-[200px] border-0 p-0 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none"
          style={{ height: 'auto' }}
        />

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImages(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
                className="hidden"
                disabled={submitting || disabled}
              />
              <div className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
                <Image className="w-4 h-4" />
                <span>Image</span>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {hasContent && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setText("");
                  setImages([]);
                }}
                disabled={submitting}
                className="text-gray-500 hover:text-gray-700"
              >
                <Trash className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!hasContent || submitting || disabled}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="ml-1">
                {submitting ? 'Adding...' : 'Add Memory'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Drop zone hint */}
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
          <div className="text-blue-600 font-medium">
            Drop images to add to your memory
          </div>
        </div>
      )}
    </div>
  );
}