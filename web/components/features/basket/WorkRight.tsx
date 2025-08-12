'use client';
import { useBasketDeltas } from './hooks';
export default function WorkRight({ basketId }:{ basketId:string }) {
  const { data: deltas } = useBasketDeltas(basketId);
  const latest = deltas?.[0];
  return (
    <div className="space-y-3">
      {!latest ? (
        <div className="rounded border p-3 text-sm text-muted-foreground">Thinking Partner (ambient) — suggestions will appear here.</div>
      ) : (
        <div className="rounded border p-3 space-y-2">
          <div className="font-medium">Change Review</div>
          <div className="text-xs text-muted-foreground">{new Date(latest.created_at).toLocaleString()}</div>
          <div className="text-sm">{latest.summary ?? 'Proposed update'}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border">Apply All</button>
            <button className="px-3 py-1 rounded border">Tweak</button>
            <button className="px-3 py-1 rounded border">Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
