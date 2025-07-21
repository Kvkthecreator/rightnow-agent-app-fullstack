import { diffWords } from "diff";
import { Card } from "@/components/ui/Card";
import type { BlockWithHistory } from "@/types";

interface Props {
  block: BlockWithHistory;
}

export default function InlineDiffCard({ block }: Props) {
  const pieces = diffWords(block.prev_content || "", block.content || "");
  return (
    <Card className="space-y-1 p-4 hover:bg-muted cursor-pointer">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium">
          {/* Use fallback safely */}
          {block?.canonical_value ?? block.content?.slice(0, 30) ?? "(Untitled)"}
        </span>
        {block?.semantic_type && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded">
            {block.semantic_type}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {pieces.map((part, idx) => {
          if (part.added) {
            return (
              <span key={idx} className="diff-added">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={idx} className="diff-removed">
                {part.value}
              </span>
            );
          }
          return <span key={idx}>{part.value}</span>;
        })}
      </p>
    </Card>
  );
}
