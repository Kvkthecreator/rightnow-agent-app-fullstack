"use client";
import { useRouter } from "next/navigation";
import { useDocuments } from "../../lib/baskets/useDocuments";

interface Props {
  basketId: string;
  activeId?: string;
}

export default function DocumentList({ basketId, activeId }: Props) {
  const { docs, isLoading, error } = useDocuments(basketId);
  const router = useRouter();

  if (isLoading) {
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

  if (docs.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">No documents yet</div>
    );
  }

  return (
    <ul className="p-6 space-y-2 overflow-y-auto flex-1">
      {docs.map((doc) => {
        const isActive = doc.id === activeId;
        const title = doc.title || "Untitled Document";
        return (
          <li
            key={doc.id}
            onClick={() =>
              router.push(`/baskets/${basketId}/docs/${doc.id}/work`)
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
