"use client";
import { useRouter } from "next/navigation";
import { useDocuments } from "../../lib/baskets/useDocuments";
import type { Document } from "@/types";

interface Props {
  basketId: string;
  documents?: Document[];
  documentId?: string;
  onSelect?: (id: string) => void;
}

export default function DocumentList({
  basketId,
  documents,
  documentId,
  onSelect,
}: Props) {
  const { docs, isLoading, error } = documents
    ? { docs: documents, isLoading: false, error: null }
    : useDocuments(basketId);
  const router = useRouter();

  const items = documents ?? docs;

  if (!documents && isLoading) {
    return (
      <ul className="p-6 space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, idx) => (
          <li key={idx} className="border rounded-md p-3 h-8" />
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">Failed to load documents</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">No documents yet.</div>
    );
  }

  return (
    <ul className="p-6 space-y-2 overflow-y-auto flex-1">
      {items.map((doc) => {
        const isActive = doc.id === documentId;
        const title = doc.title || "Untitled Document";
        return (
          <li
            key={doc.id}
            onClick={() =>
              onSelect
                ? onSelect(doc.id)
                : router.push(`/baskets/${basketId}/docs/${doc.id}/work`)
            }
            className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer ${
              isActive ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="flex-1 truncate">{title}</span>
          </li>
        );
      })}
    </ul>
  );
}
