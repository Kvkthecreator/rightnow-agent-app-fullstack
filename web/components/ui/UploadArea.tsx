// UploadArea: drag/drop & click-to-upload area with preview, progress, and removal support
"use client";
import React, { useRef, useState, useEffect } from "react";
import { uploadFile } from "@/lib/storage/upload";
import { cn } from "@/lib/utils";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

export interface UploadAreaProps {
  /** Storage path prefix (folder) within the bucket */
  prefix: string;
  /** Optional Supabase storage bucket name (default: "task-media") */
  bucket?: string;
  maxFiles: number;
  onUpload: (url: string, file: File) => void;
  maxSizeMB?: number;
  preview?: boolean;
  removable?: boolean;
  accept?: string;
  showProgress?: boolean;
  enableDrop?: boolean;
  showPreviewGrid?: boolean;
  internalDragState?: boolean;
  dragStyle?: {
    base?: string;
    active?: string;
    reject?: string;
  };
}

interface FileMeta {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  url?: string;
  errorMsg?: string;
}

export function UploadArea({
  prefix,
  bucket = "basket-dumps",
  maxFiles,
  onUpload,
  maxSizeMB = 5,
  preview = false,
  removable = false,
  accept = "*/*",
  showProgress = false,
  enableDrop = false,
  showPreviewGrid = false,
  internalDragState = false,
  dragStyle = {
    base: "border-2 border-dashed border-gray-300 p-4 rounded-md text-center transition",
    active: "border-primary bg-muted",
    reject: "border-destructive text-destructive-foreground bg-muted/50",
  },
}: UploadAreaProps) {
  const showPreview = preview || showPreviewGrid;
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressIntervals = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach(clearInterval);
    };
  }, []);

  const resetDrag = () => {
    if (internalDragState) setDragActive(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (enableDrop && internalDragState) setDragActive(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (enableDrop && internalDragState) setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetDrag();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetDrag();
    if (!enableDrop || !e.dataTransfer.files) return;
    if (files.length >= maxFiles) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleFiles = (fileList: FileList) => {
    const toUpload = Array.from(fileList).slice(0, maxFiles - files.length);
    toUpload.forEach((file) => {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} must be smaller than ${maxSizeMB}MB`);
        return;
      }
      const id = `${Date.now()}-${file.name}`;
      setFiles((prev) => [...prev, { id, file, progress: 0, status: "uploading" }]);
      if (showProgress) {
        const interval = window.setInterval(() => {
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === id && f.status === "uploading"
                ? { ...f, progress: Math.min(f.progress + Math.random() * 10, 90) }
                : f
            )
          );
        }, 500);
        progressIntervals.current[id] = interval;
      }
      const sanitizedName = sanitizeFilename(file.name);
      const filename = `${Date.now()}-${sanitizedName}`;
      uploadFile(file, `${prefix}/${filename}`, bucket)
        .then((url) => {
          if (progressIntervals.current[id]) {
            clearInterval(progressIntervals.current[id]);
            delete progressIntervals.current[id];
          }
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === id ? { ...f, url, progress: 100, status: "done" } : f
            )
          );
          onUpload(url, file);
        })
        .catch((err: any) => {
          if (progressIntervals.current[id]) {
            clearInterval(progressIntervals.current[id]);
            delete progressIntervals.current[id];
          }
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === id
                ? { ...f, progress: 100, status: "error", errorMsg: err.message }
                : f
            )
          );
        });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(dragStyle.base, dragActive && dragStyle.active)}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          disabled={files.length >= maxFiles}
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-sm">Drag &amp; drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground">
          {`(${files.length}/${maxFiles} files, max ${maxSizeMB}MB each)`}
        </p>
      </div>
      {showPreview && files.length > 0 && (
        <div className={cn(showPreviewGrid ? "grid grid-cols-3 gap-2" : "space-y-2")}>
          {files.map((f) => (
            <div key={f.id} className="relative">
              {f.url && f.file.type.startsWith("image/") ? (
                <img
                  src={f.url}
                  alt={f.file.name}
                  className="w-full h-24 object-cover rounded"
                />
              ) : (
                <div className="p-2 border rounded text-xs truncate">
                  {f.file.name}
                </div>
              )}
              {showProgress && (
                <div className="mt-1 w-full bg-muted h-1 rounded overflow-hidden">
                  <div
                    className={cn(
                      f.status === "error" ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
              {removable && f.status === "done" && (
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="absolute top-1 right-1 bg-white border px-1 py-0.5 rounded text-xs"
                >
                  ×
                </button>
              )}
              {f.status === "error" && (
                <p className="text-xs text-destructive">{f.errorMsg}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
