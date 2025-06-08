"use client";
import { useState } from "react";
import { UploadArea } from "@/components/ui/UploadArea";
import { buildContextBlocks } from "@/lib/baskets/submit";

interface Props {
  onSubmit?: (blocks: any[]) => void;
}

export default function BasketCreateForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState("");
  const [intent, setIntent] = useState("");
  const [insight, setInsight] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const addRef = (url: string) => setRefs((r) => (r.length < 3 ? [...r, url] : r));
  const removeRef = (url: string) => setRefs((r) => r.filter((u) => u !== url));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = buildContextBlocks({ topic, intent, insight, references: refs });
    onSubmit?.(blocks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">What are we working on?</label>
        <input
          className="w-full border p-2 rounded"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">What’s the objective?</label>
        <input
          className="w-full border p-2 rounded"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Extra insight (optional)</label>
        <textarea
          className="w-full border p-2 rounded"
          value={insight}
          onChange={(e) => setInsight(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Reference files</label>
        <UploadArea
          prefix="basket"
          bucket="block-files"
          maxFiles={3}
          onUpload={addRef}
          preview
          removable
          enableDrop
          showPreviewGrid
        />
        {refs.length > 0 && (
          <ul className="text-sm space-y-1">
            {refs.map((u) => (
              <li key={u} className="flex justify-between">
                <span className="truncate mr-2">{u}</span>
                <button type="button" onClick={() => removeRef(u)} className="text-red-600">remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Create Basket
      </button>
    </form>
  );
}
