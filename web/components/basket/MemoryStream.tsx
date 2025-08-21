/**
 * Component: MemoryStream
 * @contract input : TimelinePage
 * Renders fields: ts, kind, preview, payload (text/reflection fields)
 */
"use client";

import { useBasketTimeline } from "@/lib/hooks/useBasketTimeline";
import type { TimelineItem } from "@shared/contracts/memory";

export function MemoryStream({ basketId }: { basketId: string }) {
  const { data: timelinePage, error } = useBasketTimeline(basketId);

  if (error) {
    return <div className="p-4 text-sm text-red-500">Failed to load memory stream</div>;
  }

  if (!timelinePage?.items || timelinePage.items.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Add a note to see what emerges.</div>;
  }

  return (
    <ul className="space-y-2">
      {timelinePage.items.map((item) => (
        <MemoryItem key={`${item.kind}-${item.ref_id}`} item={item} />
      ))}
    </ul>
  );
}

function MemoryItem({ item }: { item: TimelineItem }) {
  return (
    <li className="border rounded p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-muted-foreground">
          {new Date(item.ts).toLocaleString()}
        </span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
          {item.kind}
        </span>
      </div>

      {item.preview && (
        <p className="text-sm text-gray-600 mb-2">{item.preview}</p>
      )}

      {item.kind === "dump" && item.payload.text && (
        <p className="text-sm whitespace-pre-wrap">{item.payload.text}</p>
      )}

      {item.kind === "reflection" && (
        <div className="space-y-1">
          {item.payload.pattern && (
            <p className="text-sm"><strong>Pattern:</strong> {item.payload.pattern}</p>
          )}
          {item.payload.tension && (
            <p className="text-sm"><strong>Tension:</strong> {item.payload.tension}</p>
          )}
          {item.payload.question && (
            <p className="text-sm"><strong>Question:</strong> {item.payload.question}</p>
          )}
        </div>
      )}
    </li>
  );
}
