"use client";

import { CaptureTray } from "@/components/create/CaptureTray";
import { useCreatePageMachine } from "@/components/create/useCreatePageMachine";

export default function CreatePage() {
  const machine = useCreatePageMachine();

  return (
    <div className="container py-8">
      <CaptureTray
        intent={machine.intent}
        items={machine.items}
        state={machine.state}
        progress={machine.progress}
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
  );
}

