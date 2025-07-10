"use client";

import { UploadArea } from "@/components/baskets/UploadArea";
import { DOC_COUNT } from "./copy";

export function UploadDocsStep({
  fileUrls,
  setFileUrls,
}: {
  fileUrls: string[];
  setFileUrls: (u: string[]) => void;
}) {
  const handleUpload = (url: string) => {
    const next = [...fileUrls, url].slice(0, DOC_COUNT);
    setFileUrls(next);
  };

  return (
    <div className="space-y-2">
      <UploadArea
        prefix="wizard"
        bucket="raw"
        maxFiles={DOC_COUNT}
        showProgress
        showPreviewGrid
        enableDrop
        onUpload={handleUpload}
      />
      <p className="text-sm text-muted-foreground">
        {fileUrls.length}/{DOC_COUNT} files uploaded
      </p>
    </div>
  );
}

export function GuidelinesStep({
  guidelines,
  setGuidelines,
}: {
  guidelines: string;
  setGuidelines: (v: string) => void;
}) {
  return (
    <textarea
      className="w-full border rounded p-2 text-sm"
      rows={4}
      placeholder="Guidelines (optional)"
      value={guidelines}
      onChange={(e) => setGuidelines(e.target.value)}
    />
  );
}

export function ReviewStep({
  fileUrls,
  guidelines,
}: {
  fileUrls: string[];
  guidelines: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      <p>{fileUrls.length} files uploaded.</p>
      {guidelines && <p>Guidelines: {guidelines}</p>}
    </div>
  );
}

export const steps = [UploadDocsStep, GuidelinesStep, ReviewStep];
export const stepLabels = ["Upload Docs", "Guidelines", "Review"];

export default steps;
