"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export interface BasketLeftNavProps {
  basketName: string;
  basketId: string;
  documentId?: string;
  contextItems: { id: string; content: string }[];
  blocks: { id: string; content: string }[];
  documents: { id: string; title?: string | null }[];
}

export default function BasketLeftNav({
  basketName,
  basketId,
  documentId,
  contextItems,
  blocks,
  documents,
}: BasketLeftNavProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 p-4 text-sm border-r overflow-y-auto space-y-4">
      <div className="font-semibold text-base">🧺 {basketName}</div>

      <div className="space-y-1">
        <Link
          href={`/baskets/${basketId}/work`}
          className={cn(
            "block px-2 py-1 rounded hover:bg-muted",
            pathname?.endsWith("/work") && "bg-muted font-semibold"
          )}
        >
          Dashboard
        </Link>
        <Link
          href={`/baskets/${basketId}/work/insights`}
          className="block px-2 py-1 rounded hover:bg-muted"
        >
          Insights
        </Link>
        <Link
          href={`/baskets/${basketId}/work/history`}
          className="block px-2 py-1 rounded hover:bg-muted"
        >
          History
        </Link>
      </div>

      <div>
        <div className="text-xs mt-4 mb-1 font-medium text-muted-foreground">Context Items</div>
        {contextItems.map((item) => (
          <div key={item.id} className="truncate text-muted-foreground text-xs">
            • {item.content}
          </div>
        ))}
      </div>

      <div>
        <div className="text-xs mt-4 mb-1 font-medium text-muted-foreground">Blocks</div>
        {blocks.map((block) => (
          <div key={block.id} className="truncate text-muted-foreground text-xs">
            • {block.content}
          </div>
        ))}
      </div>

      <div>
        <div className="text-xs mt-4 mb-1 font-medium text-muted-foreground">Documents</div>
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/baskets/${basketId}/docs/${doc.id}/work`}
            className={cn(
              "block px-2 py-1 rounded hover:bg-muted text-xs",
              documentId === doc.id && "bg-muted font-semibold"
            )}
          >
            {doc.title ?? "Untitled"}
          </Link>
        ))}
      </div>
    </div>
  );
}
