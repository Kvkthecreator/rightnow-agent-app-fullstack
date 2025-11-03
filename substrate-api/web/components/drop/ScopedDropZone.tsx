import React from "react";

interface Props {
  children: React.ReactNode;
  onFilesDropped: (files: File[]) => void;
}

export function ScopedDropZone({ children, onFilesDropped }: Props) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) onFilesDropped(files);
  };

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}
