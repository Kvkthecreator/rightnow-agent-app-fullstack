"use client";

export interface ContextItem {
  id: string;
  content: string;
}

export default function ContextPanel({ items }: { items: ContextItem[] }) {
  if (!items?.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No context items.</div>
    );
  }
  return (
    <div className="p-4 space-y-2 text-sm">
      {items.map((i) => (
        <div key={i.id} className="border rounded p-2">
          {i.content}
        </div>
      ))}
    </div>
  );
}
