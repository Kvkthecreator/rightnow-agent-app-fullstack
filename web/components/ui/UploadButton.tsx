"use client";

import React, { useState, ChangeEvent } from "react";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/Button";

interface UploadButtonProps {
  /** Destination path prefix in bucket, e.g. 'task_briefs/12345' */
  pathPrefix: string;
  /** Callback with the public URL of the uploaded file */
  onUpload: (url: string) => void;
  /** Optional button label */
  label?: string;
}

export default function UploadButton({ pathPrefix, onUpload, label = "Upload File" }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const url = await uploadFile(file, `${pathPrefix}/${filename}`);
      onUpload(url);
    } catch (err) {
      console.error("UploadButton error:", err);
      alert("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="inline-block">
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <Button variant="outline" disabled={uploading} type="button">
        {uploading ? "Uploading..." : label}
      </Button>
    </label>
  );
}