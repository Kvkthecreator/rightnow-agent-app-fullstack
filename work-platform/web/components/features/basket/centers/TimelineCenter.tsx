"use client";
import { useBasketDeltas } from '@/hooks/useBasket';

export default function TimelineCenter({ basketId }:{ basketId:string }) {
  const { data: deltas, isLoading } = useBasketDeltas(basketId);
  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading timeline…</div>;
  return (
    <div className="space-y-2">
      {(deltas ?? []).map((d:any)=>(
        <div key={d.delta_id} className="rounded border p-3">
          <div className="font-medium">{d.summary ?? 'Change'}</div>
          <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
        </div>
      ))}
      {!deltas?.length && <div className="text-sm text-muted-foreground">No changes yet.</div>}
    </div>
  );
}
