'use client';
import { useBasket, useBasketDeltas } from '../hooks';

export default function DashboardCenter({ basketId }:{ basketId:string }) {
  const { data: basket } = useBasket(basketId);
  const { data: deltas } = useBasketDeltas(basketId);
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Context OS</div>
      <div className="text-xs text-muted-foreground">
        {(basket?.raw_dumps ?? 0)} raw dumps · {(basket?.blocks ?? 0)} blocks · {(basket?.context_items ?? 0)} context · {(basket?.documents ?? 0)} docs
      </div>
      <div className="rounded border p-4 text-sm text-muted-foreground">
        Thinking Partner capture (TODO)
      </div>
      <div className="rounded border p-4">
        <div className="font-medium mb-2">Recent Activity</div>
        {!deltas?.length ? <div className="text-sm text-muted-foreground">No proposed changes yet.</div> : (
          <ul className="space-y-2">
            {deltas.slice(0,5).map((d:any)=>(
              <li key={d.delta_id} className="text-sm">
                <div className="font-medium">{d.summary ?? 'Change'}</div>
                <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
