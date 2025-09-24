"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Paperclip, X, FileText, Image, File } from "lucide-react";
import { CANONICAL_ACCEPT_ATTRIBUTE, SUPPORTED_FORMAT_DESCRIPTION, isCanonicalFile } from "@/shared/constants/canonical_file_types";
import { notificationAPI } from "@/lib/api/notifications";

interface AddMemoryComposerProps {
  basketId: string;
  disabled?: boolean;
  onSuccess?: (res: { dump_id: string }) => void;
}

export default function AddMemoryComposer({ basketId, disabled, onSuccess }: AddMemoryComposerProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If basketId is missing, disable interactions instead of redirecting.
    if (!basketId) return;
    const focusComposer = () => textareaRef.current?.focus();
    if (window.location.hash === "#add") {
      focusComposer();
    }
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        focusComposer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [basketId, router]);

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => isCanonicalFile(file));
    
    if (validFiles.length !== files.length) {
      notificationAPI.emitActionResult(
        'file.validation', 
        `Some files were not added. ${SUPPORTED_FORMAT_DESCRIPTION}`,
        { severity: 'warning' }
      );
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    const hasContent = trimmed || attachments.length > 0;
    
    if (!hasContent || !basketId || loading || disabled) return;
    setLoading(true);
    
    try {
      if (attachments.length > 0) {
        // Handle file uploads with batch processing for unified context
        const batchId = crypto.randomUUID();
        const promises = [];
        
        // Process text if present
        if (trimmed) {
          promises.push(
            fetchWithToken("/api/dumps/new", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                basket_id: basketId,
                text_dump: trimmed,
                dump_request_id: crypto.randomUUID(),
                meta: {
                  client_ts: new Date().toISOString(),
                  ingest_trace_id: crypto.randomUUID(),
                  batch_id: batchId,
                  batch_context: "multi_format_memory"
                },
              }),
            })
          );
        }
        
        // Process each file
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('basket_id', basketId);
          formData.append('dump_request_id', crypto.randomUUID());
          formData.append('meta', JSON.stringify({
            client_ts: new Date().toISOString(),
            ingest_trace_id: crypto.randomUUID(),
            batch_id: batchId,
            batch_context: "multi_format_memory",
            original_filename: file.name,
            file_type: file.type,
            upload_method: 'add_memory_modal'
          }));
          
          promises.push(
            fetchWithToken("/api/dumps/upload", {
              method: "POST",
              body: formData,
            })
          );
        }
        
        const results = await Promise.all(promises);
        const allSuccessful = results.every(res => res.ok);
        
        if (allSuccessful) {
          // Parse all responses to understand the routes
          const responses = await Promise.all(results.map(r => r.json()));
          console.log("Batch responses:", responses);
          
          const proposalCount = responses.filter(r => r.route === 'proposal').length;
          const directCount = responses.filter(r => r.route === 'direct').length;
          
          onSuccess?.({ dump_id: batchId }); // Return batch ID for tracking
          setText("");
          setAttachments([]);
          
          // Log feedback
          if (proposalCount > 0) {
            console.log(`${proposalCount} items submitted for review`);
          }
          if (directCount > 0) {
            console.log(`${directCount} items added directly`);
          }
        } else {
          console.error("Some uploads failed", results);
          notificationAPI.emitActionResult(
            'memory.upload',
            'Some uploads failed. Please try again.',
            { severity: 'error' }
          );
        }
      } else {
        // Text only - original flow
        const res = await fetchWithToken("/api/dumps/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          
          // Show feedback based on response
          if (dump.route === 'proposal') {
            // Async processing via proposal
            console.log(`Memory submitted for review (proposal: ${dump.proposal_id})`);
            notificationAPI.emitJobStarted(
              'memory.review',
              'Memory submitted for governance review',
              { basketId, correlationId: dump.proposal_id }
            );
          } else if (dump.route === 'direct') {
            // Direct commit
            console.log("Memory added successfully");
            notificationAPI.emitActionResult(
              'memory.create',
              'Memory added successfully',
              { severity: 'success' }
            );
          }
        } else {
          console.error("Failed to create dump", await res.text());
          notificationAPI.emitActionResult(
            'memory.create',
            'Failed to add memory. Please try again.',
            { severity: 'error' }
          );
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      notificationAPI.emitActionResult(
        'memory.upload',
        'Upload failed. Please try again.',
        { severity: 'error' }
      );
    } finally {
      setLoading(false);
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const hasContent = text.trim() || attachments.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="border rounded-lg bg-white">
        {/* Main input area */}
        <div className="p-3 md:p-4">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a memory, thoughts, or observations..."
            rows={8}
            disabled={disabled || loading}
            className="border-0 focus:ring-0 resize-none text-base min-h-[180px] md:min-h-[260px]"
          />
          
          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm"
                >
                  {getFileIcon(file)}
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action bar */}
        <div className="border-t px-3 md:px-4 py-2 flex items-center justify-between bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={CANONICAL_ACCEPT_ATTRIBUTE}
              onChange={handleAddAttachment}
              className="hidden"
              id="memory-file-input"
              disabled={loading}
            />
            <label 
              htmlFor="memory-file-input"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              Attach files
            </label>
            
            <span className="text-xs text-gray-500">
              {SUPPORTED_FORMAT_DESCRIPTION}
            </span>
          </div>
          
          <Button 
            type="submit" 
            disabled={disabled || loading || !hasContent}
            size="sm"
          >
            {loading ? "Adding..." : "Add memory"}
          </Button>
        </div>
      </div>
    </form>
  );
}
