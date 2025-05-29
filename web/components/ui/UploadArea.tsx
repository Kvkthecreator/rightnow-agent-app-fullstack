// web/components/ui/UploadArea.tsx
"use client";
import React, { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadFile";

interface UploadAreaProps {
  prefix: string;
  maxFiles: number;
  onUpload: (url: string) => void;
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


export function UploadArea({
  prefix,
  maxFiles,
  onUpload,
  maxSizeMB = 5,
  preview = false,
  removable = false,
}: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      const filename = `${Date.now()}-${file.name}`;
      const url = await uploadFile(file, `${prefix}`, `${filename}`);
      setUploadedUrls((prev) => [...prev, url]);
      onUpload(url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    }
  };

  const removeImage = (url: string) => {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
    // NOTE: You may also want to implement server-side removal here if needed
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center px-4 py-2 border rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
      >
        Upload Image
      </button>

      {preview && uploadedUrls.length > 0 && (
        <div className="space-y-2">
          {uploadedUrls.map((url) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt="preview"
                className="max-w-xs border rounded"
              />
              {removable && (
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-white border px-2 py-1 rounded text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
