"use client";

interface ParsedBlockListProps {
  basketId: string;
}

export default function ParsedBlockList({ basketId }: ParsedBlockListProps) {
  return (
    <div className="text-muted-foreground">
      Placeholder for parsed context blocks (basket {basketId})
    </div>
  );
}
