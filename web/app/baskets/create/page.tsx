"use client";

import { useState } from "react";
import DumpArea from "@/components/ui/DumpArea";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { createBasketWithInput } from "@/lib/baskets/createBasketWithInput";
import { toast } from "react-hot-toast";
import { ScopedDropZone } from "@/components/drop/ScopedDropZone";

export default function BasketCreatePage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFileDrop = (files: File[]) => {
    console.log("\ud83d\udcbe Basket Create dropped files:", files);
    // TODO: Route files to UploadArea or task context
  };

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) {
      toast.error("Please provide some content for the dump");
      return;
    }
    setLoading(true);
    try {
      const basket = await createBasketWithInput({ text, files });
      router.push(`/baskets/${basket.id}/work`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create basket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScopedDropZone onFilesDropped={handleFileDrop}>
      <main className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">🧠 Dump your thoughts here</h1>
        <p className="text-muted-foreground">Paste chats and upload reference files.</p>
      </div>

      <DumpArea
        text={text}
        onTextChange={setText}
        onFilesChange={(vals) => setFiles(vals)}
      />

      <div className="pt-2">
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating…" : "Create Basket"}
        </Button>
      </div>
    </main>
    </ScopedDropZone>
  );
}
