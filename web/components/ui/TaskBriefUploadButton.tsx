// web/components/ui/TaskBriefUploadButton.tsx
"use client";
import React from "react";
import { UploadArea } from "@/components/ui/UploadArea";

interface TaskBriefUploadButtonProps {
  pathPrefix: string;
  onUpload: (url: string) => void;
}

export function TaskBriefUploadButton({ pathPrefix, onUpload }: TaskBriefUploadButtonProps) {
  return (
    <UploadArea
      prefix="task_briefs"
      bucket="task-briefs"        // required: do not change, matches Supabase config
      maxFiles={5}
      onUpload={onUpload}
      maxSizeMB={5}
      accept="*/*"
      preview
      removable
      showProgress
      enableDrop
      showPreviewGrid
      internalDragState
      dragStyle={{
        base: "border-2 border-dashed border-gray-300 p-4 rounded-md text-center transition",
        active: "border-primary bg-muted",
        reject: "border-destructive text-destructive-foreground bg-muted/50"
      }}
    />
  );
}
