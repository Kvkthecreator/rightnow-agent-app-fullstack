// web/app/task-brief/create/page.tsx
"use client";
import React, { useState } from "react";
import { TaskBriefUploadButton } from "@/components/ui/TaskBriefUploadButton";

export default function TaskBriefCreatePage() {
  const [imageUrl, setImageUrl] = useState<string>("");

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Create Task Brief</h1>
      <TaskBriefUploadButton
        pathPrefix="briefs"
        onUpload={(url) => setImageUrl(url)}
        label="Upload Reference Image"
      />
      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-1">Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" className="rounded border max-w-full h-auto" />
        </div>
      )}
    </div>
  );
}
