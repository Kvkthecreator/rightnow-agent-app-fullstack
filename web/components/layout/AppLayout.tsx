"use client";
import { ReactNode } from "react";
import { useFileDrag } from "@/hooks/useFileDrag";
import { FileDropOverlay } from "@/components/FileDropOverlay";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isDraggingFile } = useFileDrag();

  function noopDropHandler(e: React.DragEvent) {
    e.preventDefault();
    // Intentionally does nothing — actual drop logic must be scoped
  }

  return (
    <div onDrop={noopDropHandler} onDragOver={(e) => e.preventDefault()}>
      <FileDropOverlay isVisible={isDraggingFile} />
      {children}
    </div>
  );
}
