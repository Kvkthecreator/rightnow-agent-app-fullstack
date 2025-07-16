import { Card } from "@/components/ui/Card";
import Link from "next/link";
import InlineDiffCard from "@/components/InlineDiffCard";
import type { BlockWithHistory } from "@/types/block";

export interface BlocksPaneProps {
  blocks: BlockWithHistory[];
}

export default function BlocksPane({ blocks }: BlocksPaneProps) {
  const proposed = (blocks || []).filter((b) => b.state === "PROPOSED");
  if (proposed.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No proposed blocks yet.
      </div>
    );
  }
  return (
    <div className="p-4 space-y-2">
      {proposed.map((block) => (
          {block.prev_rev_id && block.prev_content ? (
            <InlineDiffCard block={block} />
          ) : (
            <Card
              className={`space-y-1 p-4 hover:bg-muted cursor-pointer ${
                block.state === "PROPOSED" && !block.prev_rev_id
                  ? "block-proposed"
                  : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium">
                  {block.canonical_value || block.content.slice(0, 30)}
                </span>
                <span className="text-xs px-2 py-0.5 bg-muted rounded badge">
                  {block.semantic_type === "pending proposal"
                    ? "PROPOSED"
                    : block.semantic_type}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {block.content.slice(0, 120)}
                {block.content.length > 120 ? "…" : ""}
              </p>
            </Card>
          )}
        </Link>
      ))}
    </div>
  );
}
