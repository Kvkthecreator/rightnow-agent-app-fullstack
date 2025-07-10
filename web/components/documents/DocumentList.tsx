"use client";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useDocuments } from "@/lib/baskets/useDocuments";

dayjs.extend(relativeTime);

interface Props {
  basketId: string;
  activeId?: string;
}

export default function DocumentList({ basketId, activeId }: Props) {
  const { docs, isLoading, error } = useDocuments(basketId);

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

  return (
    <ul className="p-6 space-y-2 overflow-y-auto flex-1">
      {docs.map((doc) => {
        const isActive = doc.id === activeId;
        return (
          <li
            key={doc.id}
            className={`border rounded-md p-3 flex items-center gap-3 ${
              isActive ? "ring-2 ring-primary" : ""
            }`}
          >
            <Link
              href={`/baskets/${basketId}/docs/${doc.id}/work`}
              className="flex-1 truncate"
            >
              {doc.title}
            </Link>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {dayjs(doc.updated_at).fromNow()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
