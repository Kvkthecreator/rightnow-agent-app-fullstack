import type { Basket } from "@/types";

export async function getBasket(id: string): Promise<Basket | null> {
  try {
    const res = await fetch(`/api/baskets/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getBasket] Not found', { id });
        return null;
      }
      console.error('[getBasket] Failed', { status: res.status, id });
      throw new Error(`getBasket failed with ${res.status}`);
    }
    return (await res.json()) as Basket;
  } catch (err) {
    console.error('[getBasket] Unexpected error', err);
    throw err;
  }
}
