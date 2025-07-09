"use client";

import { useState } from "react";
import { UploadArea } from "@/components/baskets/UploadArea";

export interface UploadDocsStepProps {
  onFilesChange: (urls: string[]) => void;
}

export default function UploadDocsStep({ onFilesChange }: UploadDocsStepProps) {
  const [urls, setUrls] = useState<string[]>([]);

  const handleUpload = (url: string) => {
    const next = [...urls, url].slice(0, 3);
    setUrls(next);
    onFilesChange(next);
  };

  return (
    <div className="space-y-2">
      <UploadArea
        prefix="wizard"
        bucket="raw"
        maxFiles={3}
        showProgress
        showPreviewGrid
        enableDrop
        onUpload={handleUpload}
      />
      <p className="text-sm text-muted-foreground">{urls.length}/3 files uploaded</p>
    </div>
  );
}
