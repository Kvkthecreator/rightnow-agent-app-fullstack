"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import SmartDropZone from "@/components/SmartDropZone";
import { UploadArea } from "@/components/baskets/UploadArea";
import { createBasketNew } from "@/lib/baskets/createBasketNew";
import { useRouter } from "next/navigation";

export default function NewBasketPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!text.trim()) { alert("Please enter some text 😊"); return; }
    setSubmitting(true);
    try {
      const { id } = await createBasketNew({ text, files });
      router.push(`/baskets/${id}/work`);
    } catch (err) {
      console.error(err);
      alert("Failed to create basket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold text-center">New Basket</h1>
      <SmartDropZone
        className="w-full min-h-[200px] border rounded-md p-3"
        placeholder="Drop your thoughts here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={submitting}
      />
      <UploadArea
        prefix="dump"
        maxFiles={5}
        onUpload={(url) => setFiles((prev) => [...prev, url])}
      />
      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={submitting || !text.trim()}>
          {submitting ? "Creating…" : "Create"}
        </Button>
      </div>
    </div>
  );
}
