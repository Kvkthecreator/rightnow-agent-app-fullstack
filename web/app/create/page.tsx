"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreateFooter } from "@/components/basket/CreateFooter";

export default function CreatePage() {
  const [raw, setRaw] = useState("");
  const [intent, setIntent] = useState("");
  const [note, setNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const handleCreate = async () => {
    const payload = {
      idempotency_key: crypto.randomUUID(),
      intent: intent.trim(),
      raw_dump: { text: raw.trim(), file_urls: [] as string[] },
      notes: note.trim() ? [note.trim()] : [],
    };
    try {
      const res = await fetch("/api/baskets/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const id = data.id || data.basket_id;
      if (id) {
        router.push(`/baskets/${id}/work`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    setRaw("");
    setIntent("");
    setNote("");
    setFiles([]);
    if (fileInput.current) fileInput.current.value = "";
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleCreate();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onIntentKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && raw.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6 flex-1">
        <div className="space-y-2">
          <label className="font-medium">Raw Dump</label>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Drop raw thinking here… paste text or drag files."
            className="w-full border rounded p-2"
            style={{ minHeight: "60vh" }}
          />
          <input
            type="file"
            multiple
            ref={fileInput}
            onChange={(e) => handleFiles(e.target.files)}
            className="mt-2"
          />
          <p className="text-sm text-gray-500">
            This is your primary capture. Messy is fine.
          </p>
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-medium">Intent</label>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={onIntentKey}
            placeholder="e.g., Outline my Sept launch plan"
            className="w-full border rounded p-2"
          />
          <p className="text-sm text-gray-500">
            We’ll name your basket from this—you can rename later.
          </p>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Quick note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            rows={3}
            className="w-full border rounded p-2"
          />
          <p className="text-xs text-gray-400">{note.length}/280</p>
        </div>
      </main>

      <CreateFooter
        filesCount={files.length}
        notesCount={note.trim() ? 1 : 0}
        onCreate={handleCreate}
        onClear={handleClear}
      />
    </div>
  );
}

