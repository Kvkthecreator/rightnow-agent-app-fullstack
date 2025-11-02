"use client";
import { Textarea } from "@/components/ui/Textarea";
import React from "react";

interface SmartDropZoneProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onImages?: (files: File[]) => void;
}

export default function SmartDropZone({
  onImages,
  onPaste,
  onDrop,
  ...props
}: SmartDropZoneProps) {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items || []);
    const files = items
      .map((it) => (it.kind === "file" ? it.getAsFile() : null))
      .filter((f): f is File => !!f && f.type.startsWith("image/"));
    if (files.length) onImages?.(files);
    onPaste?.(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) onImages?.(files);
    onDrop?.(e);
  };

  return (
    <Textarea
      placeholder="Drop it"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      {...props}
    />
  );
}
