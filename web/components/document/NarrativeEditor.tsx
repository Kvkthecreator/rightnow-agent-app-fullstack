"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Block } from "@/types";

interface Props {
  rawText: string;
  blocks: Block[];
  onSelectBlock?: (id: string) => void;
}

function BlockBadge({ block, onClick }: { block: Block; onClick?: () => void }) {
  const styleMap: Record<string, string> = {
    PROPOSED: "border border-border text-muted-foreground",
    ACCEPTED: "bg-primary text-primary-foreground",
    LOCKED: "border border-border text-muted-foreground",
    CONSTANT: "bg-yellow-200 text-yellow-900",
  };
  const iconMap: Record<string, string> = {
    PROPOSED: "⬜",
    ACCEPTED: "■",
    LOCKED: "🔒",
    CONSTANT: "✦",
  };
  return (
    <span className="relative group cursor-pointer" onClick={onClick}>
      <Badge
        variant="secondary"
        className={cn("px-1 py-0.5", styleMap[block.state])}
      >
        {iconMap[block.state]} {block.canonical_value}
      </Badge>
      <span className="absolute z-10 hidden group-hover:block bg-popover text-popover-foreground border border-border text-xs rounded-md p-2 whitespace-nowrap shadow-md left-1/2 -translate-x-1/2 mt-1">
        <div>
          <strong>{block.semantic_type}</strong>
        </div>
        <div className="capitalize">{block.state.toLowerCase()}</div>
        {block.actor && <div>by {block.actor}</div>}
        {block.created_at && (
          <div>{new Date(block.created_at).toLocaleString()}</div>
        )}
      </span>
    </span>
  );
}

export default function NarrativeEditor({ rawText, blocks, onSelectBlock }: Props) {
  const content = useMemo(() => {
    const ranges: { start: number; end: number; block: Block }[] = [];
    blocks.forEach((blk) => {
      if (!blk.canonical_value) return;
      const idx = rawText.indexOf(blk.canonical_value);
      if (idx === -1) return;
      if (ranges.some((r) => idx < r.end && idx + blk.canonical_value!.length > r.start)) {
        return;
      }
      ranges.push({ start: idx, end: idx + blk.canonical_value.length, block: blk });
    });
    ranges.sort((a, b) => a.start - b.start);

    const segs: React.ReactNode[] = [];
    let last = 0;
    ranges.forEach((r) => {
      if (last < r.start) segs.push(rawText.slice(last, r.start));
      segs.push(
        <BlockBadge key={r.block.id} block={r.block} onClick={() => onSelectBlock?.(r.block.id)} />
      );
      last = r.end;
    });
    if (last < rawText.length) segs.push(rawText.slice(last));
    return segs;
  }, [rawText, blocks, onSelectBlock]);

  return <div className="whitespace-pre-wrap text-sm leading-6 space-y-2">{content}</div>;
}

