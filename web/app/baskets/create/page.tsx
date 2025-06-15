"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { UploadArea } from "@/components/baskets/UploadArea";
import { createBasketWithInput } from "@/lib/baskets/createBasketWithInput";
import { toast } from "react-hot-toast";

export default function BasketCreatePage() {
  const [dumpText, setDumpText] = useState("");
  const [name, setName] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!dumpText.trim() && fileUrls.length === 0) return;
    setSubmitting(true);
    try {
      const basket = await createBasketWithInput({ text: dumpText, files: fileUrls });
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
      <div className="text-center text-2xl font-brand">🧶 start a new thread</div>

      <Textarea
        className={`min-h-[300px] w-full resize-y rounded-2xl border p-4 text-lg shadow-sm bg-muted/50 ${submitting ? "opacity-80" : ""}`}
        placeholder="Pour your thoughts, ideas, or goals here..."
        value={dumpText}
        onChange={(e) => setDumpText(e.target.value)}
        readOnly={submitting}
      />

      <UploadArea
        prefix="basket-draft"
        maxFiles={5}
        onUpload={(url) => setFileUrls((prev) => [...prev, url])}
      />

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Name your basket (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
        <Button onClick={handleCreate} disabled={submitting || (!dumpText.trim() && fileUrls.length === 0)}>
          {submitting ? "Creating…" : "Create Basket"}
        </Button>
      </div>
    </div>
  );
}
