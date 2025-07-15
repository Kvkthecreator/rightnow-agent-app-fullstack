"use client";
import DocumentList from "@/components/documents/DocumentList";
import { Button } from "@/components/ui/Button";

interface Props {
  basketId: string;
  activeId?: string;
}

export default function BasketDocList({ basketId, activeId }: Props) {
  return (
    <div className="flex flex-col h-full">
      <DocumentList basketId={basketId} activeId={activeId} />
      <div className="p-4 border-t">
        <Button size="sm" className="w-full" disabled>
          + Add Document
        </Button>
      </div>
    </div>
  );
}
