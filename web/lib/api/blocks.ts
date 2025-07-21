// ❗ CSR-only helper
// This file is for client-side API calls via fetch('/api/...')
// Do NOT use inside server components – use lib/server/* instead.
import type { Block } from "@/types";

export async function getBlocks(basketId: string): Promise<Block[]> {
  try {
    const res = await fetch(`/api/baskets/${basketId}/blocks`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getBlocks] Not found', { basketId });
        return [];
      }
      console.error('[getBlocks] Failed', { status: res.status, basketId });
      throw new Error(`getBlocks failed with ${res.status}`);
    }
    return (await res.json()) as Block[];
  } catch (err) {
    console.error('[getBlocks] Unexpected error', err);
    throw err;
  }
}
