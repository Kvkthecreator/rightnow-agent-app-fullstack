"use client";
import DocumentList from "@/components/basket/DocumentList";
import { Button } from "@/components/ui/Button";

import type { Document } from "@/types/document";

interface Props {
  basketId: string;
  documents: Document[];
  documentId?: string;
  onSelect?: (id: string) => void;
}

export default function BasketDocList({
  basketId,
  documents,
  documentId,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <DocumentList
        basketId={basketId}
        documents={documents}
        documentId={documentId}
        onSelect={onSelect}
      />
      <div className="p-4 border-t">
        <Button size="sm" className="w-full" disabled>
          + Add Document
        </Button>
      </div>
    </div>
  );
}
