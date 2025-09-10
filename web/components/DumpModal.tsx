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
import { createDump } from "@/lib/api/dumps";
import { notificationService } from '@/lib/notifications/service';
import { InlineWorkStatus } from "@/components/work/InlineWorkStatus";

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
  const [workId, setWorkId] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => setOpen(initialOpen), [initialOpen]);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-dump-modal", handler);
    return () => window.removeEventListener("open-dump-modal", handler);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      notificationService.notify({
        type: 'substrate.dump.rejected',
        title: 'Validation Error',
        message: 'Please provide some content for the dump',
        severity: 'error'
      });
      return;
    }
    setLoading(true);
    try {
      const result = await createDump({
        basket_id: basketId,
        dump_request_id: crypto.randomUUID(),
        text_dump: text,
      });
      
      if (result.work_id) {
        // Canon v2.1: Show universal work status
        setWorkId(result.work_id);
        setShowStatus(true);
        notificationService.notify({
          type: 'substrate.dump.processing',
          title: 'Dump Queued',
          message: 'Your memory has been queued for processing',
          severity: 'success'
        });
      } else {
        notificationService.notify({
          type: 'substrate.dump.processed',
          title: 'Memory Saved',
          message: 'Your memory has been saved successfully',
          severity: 'success'
        });
        setOpen(false);
      }
      
      setText("");
      setImages([]);
    } catch (err) {
      console.error(err);
      notificationService.notify({
        type: 'substrate.dump.rejected',
        title: 'Failed to Save',
        message: 'Unable to save your memory. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setShowStatus(false);
      setWorkId(null);
      setText("");
      setImages([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Dump</DialogTitle>
          <DialogDescription>
            Paste or drag text or screenshots. Shortcut ⌘/Ctrl + Shift + V
          </DialogDescription>
        </DialogHeader>
        <Card className="max-w-2xl p-8 mx-auto">
          <CardContent className="space-y-4 p-0">
            {!showStatus ? (
              <>
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
              </>
            ) : (
              <>
                {/* Processing Status Display */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium mb-2">Processing Started</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your content is being processed through the P0→P1→P2→P3 pipeline
                  </p>
                  {workId && (
                    <InlineWorkStatus
                      workId={workId}
                      showProgress={true}
                      size="lg"
                      className="justify-center"
                    />
                  )}
                </div>
                <div className="flex justify-center space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/baskets/${basketId}/memory`, '_blank')}
                  >
                    View in Memory
                  </Button>
                  <Button onClick={() => setOpen(false)}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
