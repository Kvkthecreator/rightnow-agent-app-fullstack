import type { BasketChangeRequest, BasketDelta } from "@shared/contracts/basket";

export async function postBasketWork(req: BasketChangeRequest): Promise<BasketDelta> {
  const res = await fetch(`/api/baskets/${req.basket_id}/work`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`postBasketWork failed: ${res.status}`);
  return res.json();
}

export async function listDeltas(basketId: string) {
  const res = await fetch(`/api/baskets/${basketId}/deltas`);
  if (!res.ok) throw new Error(`listDeltas failed: ${res.status}`);
  return res.json();
}

export async function applyDelta(basketId: string, deltaId: string) {
  const res = await fetch(`/api/baskets/${basketId}/apply/${deltaId}`, { method: "POST" });
  if (!res.ok) throw new Error(`applyDelta failed: ${res.status}`);
  return res.json();
}
