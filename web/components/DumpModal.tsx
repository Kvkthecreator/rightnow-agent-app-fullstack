"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/Card";
import SmartDropZone from "@/components/SmartDropZone";
import ThumbnailStrip from "@/components/ThumbnailStrip";
import { Button } from "@/components/ui/Button";
import { createDump } from "@/lib/dumps/createDump";
import { toast } from "react-hot-toast";

export interface DumpModalProps {
  basketId: string;
  initialOpen?: boolean;
}

export function openDumpModal() {
  window.dispatchEvent(new Event("open-dump-modal"));
}

export default function DumpModal({ basketId, initialOpen = false }: DumpModalProps) {
  const [open, setOpen] = useState(initialOpen);
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setOpen(initialOpen), [initialOpen]);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-dump-modal", handler);
    return () => window.removeEventListener("open-dump-modal", handler);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      toast.error("Please provide some content for the dump");
      return;
    }
    setLoading(true);
    try {
      await createDump(basketId, text);
      toast.success("Dump saved ✓");
      setOpen(false);
      setText("");
      setImages([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save dump");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Dump</DialogTitle>
          <DialogDescription>
            Paste or drag text or screenshots. Shortcut ⌘/Ctrl + Shift + V
          </DialogDescription>
        </DialogHeader>
        <Card className="max-w-2xl p-8 mx-auto">
          <CardContent className="space-y-4 p-0">
            <SmartDropZone
              value={text}
              onChange={(e) => setText(e.target.value)}
              onImages={(f) => setImages((prev) => [...prev, ...f])}
              rows={5}
            />
            {images.length > 0 && <ThumbnailStrip files={images} />}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (basketId ? "Adding…" : "Creating…") : "Save to Basket ↵"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
