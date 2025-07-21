// ❗ CSR-only helper
// This file is for client-side API calls via fetch('/api/...')
// Do NOT use inside server components – use lib/server/* instead.
import type { Basket } from "@/types";

export async function getBasket(id: string): Promise<Basket | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.yarnnn.com";

    const res = await fetch(`${baseUrl}/api/baskets/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        console.warn("[getBasket] Not found", { id });
        return null;
      }
      console.error("[getBasket] Failed", { status: res.status, id });
      throw new Error(`getBasket failed with ${res.status}`);
    }

    return (await res.json()) as Basket;
  } catch (err) {
    console.error("[getBasket] Unexpected error", err);
    throw err;
  }
}
