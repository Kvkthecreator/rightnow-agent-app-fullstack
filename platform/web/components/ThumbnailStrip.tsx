"use client";
import { useEffect, useState } from "react";

interface Props {
  files: File[];
}

export default function ThumbnailStrip({ files }: Props) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="flex gap-2 mt-2">
      {urls.map((u, idx) => (
        <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border bg-muted">
          <img src={u} alt="preview" className="object-cover w-full h-full" />
        </div>
      ))}
    </div>
  );
}
