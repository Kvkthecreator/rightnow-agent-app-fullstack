import type { Dump } from "@/types";

export async function getLatestDump(basketId: string): Promise<Dump | null> {
  try {
    const res = await fetch(`/api/baskets/${basketId}/dumps/latest`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getLatestDump] Not found', { basketId });
        return null;
      }
      console.error('[getLatestDump] Failed', { status: res.status, basketId });
      throw new Error(`getLatestDump failed with ${res.status}`);
    }
    return (await res.json()) as Dump;
  } catch (err) {
    console.error('[getLatestDump] Unexpected error', err);
    throw err;
  }
}
