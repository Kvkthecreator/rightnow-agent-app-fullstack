"use client";

import { useState } from "react";
import { CaptureTray } from "@/components/create/CaptureTray";
import { PreviewPanel } from "@/components/create/PreviewPanel";
import { useCreatePageMachine } from "@/components/create/useCreatePageMachine";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";

export default function CreatePage() {
  const machine = useCreatePageMachine();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="container py-8">
      <div className="md:flex md:gap-6">
        <div className="md:w-1/2">
          <CaptureTray
            intent={machine.intent}
            items={machine.items}
            onIntent={machine.setIntent}
            addFiles={machine.addFiles}
            addUploadedFile={machine.addUploadedFile}
            addUrl={machine.addUrl}
            addNote={machine.addNote}
            removeItem={machine.removeItem}
            clearAll={machine.clearAll}
            generate={machine.generate}
          />
        </div>
        <div className="hidden md:block md:w-1/2">
          <PreviewPanel
            intent={machine.intent}
            items={machine.items}
            state={machine.state}
            progress={machine.progress}
            error={machine.error}
          />
        </div>
      </div>

      <div className="mt-4 md:hidden">
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="p-4 sm:max-w-lg">
            <PreviewPanel
              intent={machine.intent}
              items={machine.items}
              state={machine.state}
              progress={machine.progress}
              error={machine.error}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-xs text-gray-500 mt-4">State: {machine.state}</div>
    </div>
  );
}

