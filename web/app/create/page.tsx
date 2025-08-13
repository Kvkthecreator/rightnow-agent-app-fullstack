"use client";

import { CaptureTray } from "@/components/create/CaptureTray";
import { PreviewPanel } from "@/components/create/PreviewPanel";
import { useCreatePageMachine } from "@/components/create/useCreatePageMachine";

export default function CreatePage() {
  const machine = useCreatePageMachine();

  return (
    <div className="container py-8">
      <div className="md:grid md:grid-cols-2 md:gap-6">
        <CaptureTray
          intent={machine.intent}
          items={machine.items}
          onIntent={machine.setIntent}
          addFiles={machine.addFiles}
          addUrl={machine.addUrl}
          addNote={machine.addNote}
          removeItem={machine.removeItem}
          clearAll={machine.clearAll}
          generate={machine.generate}
        />
        <div className="hidden md:block">
          <PreviewPanel
            intent={machine.intent}
            items={machine.items}
            state={machine.state}
            progress={machine.progress}
          />
        </div>
      </div>

      <div className="md:hidden mt-8">
        <details>
          <summary className="cursor-pointer">Preview</summary>
          <PreviewPanel
            intent={machine.intent}
            items={machine.items}
            state={machine.state}
            progress={machine.progress}
          />
        </details>
      </div>

      <div className="text-xs text-gray-500 mt-4">State: {machine.state}</div>
    </div>
  );
}

