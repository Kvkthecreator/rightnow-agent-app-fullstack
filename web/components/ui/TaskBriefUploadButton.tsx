// web/components/ui/TaskBriefUploadButton.tsx
"use client";
import React from "react";
import { UploadArea } from "@/components/ui/UploadArea";

interface TaskBriefUploadButtonProps {
  pathPrefix: string;
  onUpload: (url: string) => void;
  label?: string; // ✅ Add this line
}

export function TaskBriefUploadButton({
  pathPrefix,
  onUpload,
  label = "Upload File", // ✅ default fallback
}: TaskBriefUploadButtonProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <UploadArea
        prefix={`task_briefs/${pathPrefix}`}
        onUpload={onUpload}
        maxFiles={5}
        maxSizeMB={5}
        preview
        removable
        showProgress
        enableDrop
        showPreviewGrid
        internalDragState
        accept="*/*"
        dragStyle={{
          base: "border-2 border-dashed border-gray-300 p-4 rounded-md text-center transition",
          active: "border-primary bg-muted",
          reject: "border-destructive text-destructive-foreground bg-muted/50",
        }}
      />
    </div>
  );
}
