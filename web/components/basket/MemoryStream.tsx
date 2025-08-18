"use client";

import type { Note } from "@/lib/reflection";

export function MemoryStream({ items }: { items: Note[] }) {
  if (items.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Add a note to see what emerges.</div>;
  }
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id} className="border rounded p-3">
          {n.created_at && (
            <p className="text-xs text-muted-foreground mb-1">
              {new Date(n.created_at).toLocaleString()}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap">{n.text}</p>
        </li>
      ))}
    </ul>
  );
}
