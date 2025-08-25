"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { createDump } from "@/lib/api/dumps";
import { uploadFile } from "@/lib/storage/upload";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_MB } from "@/constants/uploads";
import { X, File as FileIcon } from "lucide-react";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

interface DumpBarPanelProps {
  basketId: string;
  onClose: () => void;
}

interface LocalFile {
  id: string;
  file: File;
  url?: string;
  uploading: boolean;
}

export default function DumpBarPanel({ basketId, onClose }: DumpBarPanelProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isAllowedMime = (type: string) =>
    ALLOWED_MIME_TYPES.some((t) => (t.endsWith("/*") ? type.startsWith(t.slice(0, -1)) : t === type));

  const onDrop = (accepted: File[]) => {
    accepted.forEach(async (file) => {
      if (!isAllowedMime(file.type)) {
        toast.error("Unsupported file type");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
        return;
      }
      const id = crypto.randomUUID();
      setFiles((prev) => [...prev, { id, file, uploading: true }]);
      try {
        const sanitized = sanitizeFilename(file.name);
        const filename = `${Date.now()}-${sanitized}`;
        const url = await uploadFile(file, `dump_${basketId}/${filename}`);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, url, uploading: false } : f)));
      } catch (e: any) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        toast.error(e?.message || "Upload failed");
      }
    });
  };

  const accept = ALLOWED_MIME_TYPES.reduce<Record<string, string[]>>((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
  });

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.files || []);
    if (items.length) {
      e.preventDefault();
      onDrop(items);
    }
  };

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 8 * 24) + "px";
  }

  useEffect(() => {
    autoGrow();
  }, [text]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    if (submitting || files.some((f) => f.uploading)) return;
    const urls = files.map((f) => f.url).filter(Boolean) as string[];
    if (!text.trim() && urls.length === 0) return;
    setSubmitting(true);
    try {
      if (text.trim()) {
        await createDump({
          basket_id: basketId,
          dump_request_id: crypto.randomUUID(),
          text_dump: text.trim(),
        });
      }
      for (const url of urls) {
        await createDump({
          basket_id: basketId,
          dump_request_id: crypto.randomUUID(),
          file_url: url,
        });
      }
      toast.success(
        <span>
          Captured
          <a className="ml-2 underline" href={`/baskets/${basketId}/timeline`}>
            View in Timeline
          </a>
        </span>
      );
      setText("");
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["timeline", basketId, "all"] });
      await queryClient.invalidateQueries({ queryKey: ["memory:recent", basketId] });
      onClose();
    } catch (e) {
      toast.error("Failed to capture");
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const disabled = submitting || files.some((f) => f.uploading);

  const panel = (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md md:max-w-lg">
      <div
        className="relative max-h-[60vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
        aria-busy={disabled}
      >
        <button
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={autoGrow}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
            placeholder="Capture a memory..."
            rows={3}
            maxLength={280}
            disabled={disabled}
          />
          <div className="text-right text-xs text-muted-foreground">{text.length}/280</div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-4 text-center text-sm cursor-pointer ${
              isDragActive ? "bg-muted" : ""
            }`}
          >
            <input {...getInputProps()} />
            <p>Drag & drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF or images up to {MAX_FILE_SIZE_MB}MB</p>
          </div>
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center space-x-2 rounded border p-2">
                  {f.file.type.startsWith("image/") && f.url ? (
                    <img src={f.url} className="w-12 h-12 object-cover rounded" alt={f.file.name} />
                  ) : (
                    <FileIcon className="w-12 h-12 p-2 text-muted-foreground" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm">{f.file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(f.file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                  {f.uploading && <span className="text-xs">Uploading...</span>}
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removeFile(f.id)}
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={disabled || (!text.trim() && files.length === 0)}>
              {submitting ? "Capturing..." : "Capture"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(panel, document.body);
}
