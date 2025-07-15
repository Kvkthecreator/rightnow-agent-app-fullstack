"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  basketId: string;
  documents: { id: string; title: string }[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function BasketDocList({
  basketId,
  documents,
  selectedId,
  onSelect,
}: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {documents.map((doc) => {
        const isSelected = selectedId
          ? selectedId === doc.id
          : pathname?.includes(doc.id);

        return onSelect ? (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={cn(
              "text-left px-3 py-1.5 text-sm rounded hover:bg-accent transition",
              isSelected && "bg-accent text-primary font-medium"
            )}
          >
            {doc.title || "Untitled"}
          </button>
        ) : (
          <Link
            key={doc.id}
            href={`/baskets/${basketId}/docs/${doc.id}/work`}
            className={cn(
              "block px-3 py-1.5 text-sm rounded hover:bg-accent transition",
              isSelected && "bg-accent text-primary font-medium"
            )}
          >
            {doc.title || "Untitled"}
          </Link>
        );
      })}
    </nav>
  );
}
