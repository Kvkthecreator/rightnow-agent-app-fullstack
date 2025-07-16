"use client";
import { ReactNode } from "react";
import BasketDocList from "@/components/basket/BasketDocList";
import NarrativePane from "@/components/basket/NarrativePane";
import type { BasketSnapshot } from "@/lib/baskets/getSnapshot";
import type { Document } from "@/types/document";

interface Props {
  snapshot: BasketSnapshot;
  documents: Document[];
  documentId?: string;
  onSelectDocument?: (id: string) => void;
  onRunBlockifier?: () => void;
  runningBlockifier?: boolean;
  onSelectBlock?: (id: string) => void;
  rightPanel?: ReactNode;
  children?: ReactNode;
}

export default function DocumentWorkbenchLayout({
  snapshot,
  documents,
  documentId,
  onSelectDocument,
  onRunBlockifier,
  runningBlockifier,
  onSelectBlock,
  rightPanel,
  children,
}: Props) {
  return (
    <div className="md:flex w-full min-h-screen">
      <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
        <BasketDocList
          basketId={snapshot.basket.id}
          documents={documents}
          documentId={documentId}
          onSelect={onSelectDocument}
        />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/70 px-4 py-2 backdrop-blur">
          <h1 className="flex-1 truncate text-sm font-medium">
            {snapshot.basket?.name || "Untitled Basket"}
          </h1>
          <span className="text-xs px-2 py-0.5 bg-muted rounded">DRAFT</span>
          {onRunBlockifier && (
            <button
              className="text-sm text-primary"
              onClick={onRunBlockifier}
              disabled={runningBlockifier}
            >
              {runningBlockifier ? "Running..." : "Run Blockifier"}
            </button>
          )}
        </header>
        <div className="md:flex w-full flex-1">
          <div className="flex-1">
            <div className="p-4 space-y-4">
              <NarrativePane
                rawText={snapshot.raw_dump_body}
                blocks={snapshot.blocks || []}
                onSelectBlock={onSelectBlock}
              />
              {children}
            </div>
          </div>
          {rightPanel && (
            <aside className="hidden md:block w-[320px] shrink-0 border-l bg-gray-50 overflow-y-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
