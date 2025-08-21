import { cookies } from "next/headers";
import { listBasketsByWorkspace } from "./listBasketsByWorkspace";

interface Params {
  workspaceId: string;
  idempotencyKey: string;
  name: string;
}

export async function getOrCreateDefaultBasket({ workspaceId, idempotencyKey, name }: Params) {
  const { data: existing, error } = await listBasketsByWorkspace(workspaceId);
  if (error) throw error;
  if (existing && existing.length >= 1) {
    return existing[0];
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(`${base}/api/baskets/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      Cookie: cookies().toString(),
    },
    body: JSON.stringify({ workspace_id: workspaceId, name }),
  });

  if (res.ok || res.status === 409) {
    const data = await res.json();
    const id = data.id || data.basket_id;
    return { id };
  }

  throw new Error("Failed to create default basket");
}
