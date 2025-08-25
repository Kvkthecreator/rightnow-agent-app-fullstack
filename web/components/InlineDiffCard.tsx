import { diffWords } from "diff";
import { Card } from "@/components/ui/Card";
import type { BlockWithHistory } from "@shared/contracts";

interface Props {
  block: BlockWithHistory;
}

export default function InlineDiffCard({ block }: Props) {
  const pieces = diffWords(block.prev_content || "", block.content || "");

  // Narrow for optional fields that may not exist on the type
  // TODO: Legacy patch. Remove `as any` after type refactor.
  const canonicalValue =
    // TODO: Legacy patch. Remove `as any` after type refactor.
    typeof (block as any).canonical_value === "string"
      ? (block as any).canonical_value
      : undefined;

  // TODO: Legacy patch. Remove `as any` after type refactor.
  const semanticType =
    // TODO: Legacy patch. Remove `as any` after type refactor.
    typeof (block as any).semantic_type === "string"
      ? (block as any).semantic_type
      : undefined;

  return (
    <Card className="space-y-1 p-4 hover:bg-muted cursor-pointer">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium">
          {canonicalValue ?? block.content?.slice(0, 30) ?? "(Untitled)"}
        </span>
        {semanticType && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded">
            {semanticType}
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
