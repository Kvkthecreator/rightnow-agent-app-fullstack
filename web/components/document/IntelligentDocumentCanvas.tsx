"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Block } from "@/types";
import DocumentIntelligenceLayer from "@/components/intelligence/DocumentIntelligenceLayer";

interface Props {
  documentId: string;
  basketId: string;
  rawText: string;
  blocks: Block[];
  onSelectBlock?: (id: string) => void;
  onBlockCreate?: (suggestion: any) => void;
  onDocumentNavigate?: (documentId: string) => void;
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
        className={
          cn("px-1 py-0.5", styleMap[(block as any).state ?? "PROPOSED"])
        }
      >
        {iconMap[(block as any).state ?? "PROPOSED"]}
        {(block as any).canonical_value ?? ""}
      </Badge>
      <span className="absolute z-10 hidden group-hover:block bg-popover text-popover-foreground border border-border text-xs rounded-md p-2 whitespace-nowrap shadow-md left-1/2 -translate-x-1/2 mt-1">
        <div>
          <strong>
            {(block as any).semantic_type ?? "UNKNOWN"}
          </strong>
        </div>
        <div className="capitalize">
          {((block as any).state ?? "PROPOSED").toLowerCase()}
        </div>
        {(block as any).actor && <div>by {(block as any).actor}</div>}
        {(block as any).created_at && (
          <div>{new Date((block as any).created_at).toLocaleString()}</div>
        )}
      </span>
    </span>
  );
}

export default function IntelligentDocumentCanvas({
  documentId,
  basketId,
  rawText,
  blocks,
  onSelectBlock,
  onBlockCreate,
  onDocumentNavigate
}: Props) {
  const content = useMemo(() => {
    const ranges: { start: number; end: number; block: Block }[] = [];
    blocks.forEach((blk) => {
      if (!(blk as any).canonical_value) return;
      const idx = rawText.indexOf((blk as any).canonical_value ?? "");
      if (idx === -1) return;
      if (ranges.some((r) => idx < r.end && idx + ((blk as any).canonical_value ?? "").length > r.start)) {
        return;
      }
      ranges.push({ start: idx, end: idx + ((blk as any).canonical_value ?? "").length, block: blk });
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

  return (
    <DocumentIntelligenceLayer
      documentId={documentId}
      basketId={basketId}
      onBlockCreate={onBlockCreate}
      onDocumentNavigate={onDocumentNavigate}
      className="whitespace-pre-wrap text-sm leading-6 space-y-2"
    >
      {content}
    </DocumentIntelligenceLayer>
  );
}