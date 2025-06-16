"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import SmartDropZone from "@/components/SmartDropZone";
import { UploadArea } from "@/components/baskets/UploadArea";
import { createBasketWithInput } from "@/lib/baskets/createBasketWithInput";
import { toast } from "react-hot-toast";

export default function BasketCreatePage() {
  const [dumpText, setDumpText] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const urls = files.map((f) =>
      typeof f === "string" ? f : URL.createObjectURL(f)
    );
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  const handleCreate = async () => {
    if (!dumpText.trim()) return;
    setSubmitting(true);
    try {
      const basket = await createBasketWithInput({ text: dumpText, files });
      if (name.trim()) {
        // optional: update basket name if API exists
      }
      window.location.href = `/baskets/${basket.id}/work`;
    } catch (err) {
      console.error(err);
      toast.error("Failed to create basket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-center text-2xl font-brand">🧶 start a new thread</h1>

      <Input
        placeholder="Name this basket (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
      />

      <h2 className="text-lg font-medium">What are we working on?</h2>

      <SmartDropZone
        className={`min-h-[300px] w-full resize-y rounded-2xl border p-4 text-lg shadow-sm bg-muted/50 ${submitting ? "opacity-80" : ""}`}
        placeholder="Pour your thoughts, ideas, or goals here..."
        value={dumpText}
        onChange={(e) => setDumpText(e.target.value)}
        readOnly={submitting}
        onImages={(imgs) => setFiles((prev) => [...prev, ...imgs])}
      />

      <div className="space-y-2">
        <UploadArea
          prefix="basket-draft"
          maxFiles={5}
          onUpload={(url) => setFiles((prev) => [...prev, url])}
        />
        <p className="text-xs text-muted-foreground">
          You can also drag and drop files.
        </p>

        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {previewUrls.map((u, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded overflow-hidden border bg-muted">
                <img src={u} alt="upload" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 bg-white/70 hover:bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={submitting || !dumpText.trim()}>
          {submitting ? "Creating…" : "Create Basket"}
        </Button>
      </div>
    </div>
  );
}
