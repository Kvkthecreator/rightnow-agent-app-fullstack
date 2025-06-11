"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/Card";
import DumpArea from "@/components/ui/DumpArea";
import { Button } from "@/components/ui/Button";
import { createBasketWithInput } from "@/lib/baskets/createBasketWithInput";
import { createDump } from "@/lib/baskets/createDump";
import { toast } from "react-hot-toast";

export interface DumpModalProps {
  basketId?: string | null;
  initialOpen?: boolean;
}

export function openDumpModal({ basketId }: { basketId?: string | null } = {}) {
  window.dispatchEvent(new CustomEvent("open-dump-modal", { detail: { basketId } }));
}

export default function DumpModal({ basketId: propBasketId, initialOpen = false }: DumpModalProps) {
  const [open, setOpen] = useState(initialOpen);
  const [basketId, setBasketId] = useState<string | null>(propBasketId ?? null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setOpen(initialOpen), [initialOpen]);
  useEffect(() => setBasketId(propBasketId ?? null), [propBasketId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setBasketId(detail.basketId ?? null);
      setOpen(true);
    };
    window.addEventListener("open-dump-modal", handler);
    return () => window.removeEventListener("open-dump-modal", handler);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) {
      toast.error("Please provide some content for the dump");
      return;
    }
    setLoading(true);
    try {
      if (basketId) {
        await createDump({ basketId, text, files });
        toast.success("Dump added");
      } else {
        const basket = await createBasketWithInput({ text, files });
        toast.success("Basket created");
        window.location.href = `/baskets/${basket.id}/work`;
      }
      setOpen(false);
      setText("");
      setFiles([]);
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
        <Card className="max-w-2xl p-8 mx-auto">
          <CardContent className="space-y-6 p-0">
            <h1 className="text-2xl font-semibold">What are we working on?</h1>
            <DumpArea text={text} onTextChange={setText} onFilesChange={setFiles} />
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (basketId ? "Adding…" : "Creating…") : basketId ? "Add Dump" : "Create Basket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
