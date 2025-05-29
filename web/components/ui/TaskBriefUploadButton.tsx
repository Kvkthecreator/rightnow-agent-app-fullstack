// web/components/ui/TaskBriefUploadButton.tsx
"use client";
import React from "react";
import { uploadFile } from "@/lib/upload";

interface TaskBriefUploadButtonProps {
  pathPrefix: string;
  onUpload: (url: string) => void;
  label?: string;
}

export function TaskBriefUploadButton({
  pathPrefix,
  onUpload,
  label = "Upload",
}: TaskBriefUploadButtonProps) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const filename = `${Date.now()}-${file.name}`;
      const path = `${pathPrefix}/${filename}`;
      const url = await uploadFile(file, path, "task-media");
      onUpload(url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <label className="cursor-pointer inline-flex items-center px-4 py-2 border rounded shadow text-sm font-medium bg-white text-gray-700 hover:bg-gray-50">
        {label}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
    </>
  );
}
