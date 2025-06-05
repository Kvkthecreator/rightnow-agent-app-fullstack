"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface Block {
  id: string;
  type: string;
  label: string;
  content: string;
  update_policy: string;
  is_core_block: boolean;
}

interface BlockCardProps {
  block: Block;
  onToggleAuto?: (id: string, enable: boolean) => void;
}

export default function BlockCard({ block, onToggleAuto }: BlockCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          {block.label}
          <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 rounded">
            {block.type}
          </span>
        </div>
        {onToggleAuto && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleAuto(block.id, block.update_policy !== "auto")}
          >
            {block.update_policy === "auto" ? "Manual" : "Auto-update"}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {block.content.slice(0, 120)}
        {block.content.length > 120 ? "…" : ""}
      </p>
    </Card>
  );
}
