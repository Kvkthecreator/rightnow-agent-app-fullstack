// ❗ CSR-only helper
// This file is for client-side API calls via fetch('/api/...')
// Do NOT use inside server components – use lib/server/* instead.
import type { Document } from "@/types";

export async function getDocuments(basketId: string): Promise<Document[]> {
  try {
    const res = await fetch(`/api/baskets/${basketId}/docs`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getDocuments] Not found', { basketId });
        return [];
      }
      console.error('[getDocuments] Failed', { status: res.status, basketId });
      throw new Error(`getDocuments failed with ${res.status}`);
    }
    return (await res.json()) as Document[];
  } catch (err) {
    console.error('[getDocuments] Unexpected error', err);
    throw err;
  }
}
