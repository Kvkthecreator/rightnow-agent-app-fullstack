"use client";
import { useBlocks } from "@/lib/baskets/useBlocks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface Props {
  basketId: string;
  highlightCommitId?: string | null;
}

export default function BlocksList({ basketId, highlightCommitId }: Props) {
  const { blocks, isLoading } = useBlocks(basketId);

  if (isLoading) {
    return (
      <ul className="p-6 space-y-2 overflow-y-auto flex-1 animate-pulse">
        {Array.from({ length: 3 }).map((_, idx) => (
          <li key={idx} className="border rounded-md p-3 h-8" />
        ))}
      </ul>
    );
  }

  return (
    <ul className="p-6 space-y-2 overflow-y-auto flex-1">
      {blocks.map((blk) => {
        const isHighlight = blk.commit_id && blk.commit_id === highlightCommitId;
        return (
          <li
            key={blk.id}
            className={`border rounded-md p-3 flex items-center gap-3 ${
              isHighlight ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="text-[10px] uppercase text-muted-foreground w-14 shrink-0">
              {blk.type || "note"}
            </span>
            <span className="flex-1 truncate">{blk.label}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {dayjs(blk.updated_at).fromNow()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
