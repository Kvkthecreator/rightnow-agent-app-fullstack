import type { ContextItem } from "@/types";

export async function getContextItems(docId: string): Promise<ContextItem[]> {
  try {
    const url = docId
      ? `/api/context_items?document_id=${docId}`
      : '/api/context_items';
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getContextItems] Not found', { docId });
        return [];
      }
      console.error('[getContextItems] Failed', { status: res.status, docId });
      throw new Error(`getContextItems failed with ${res.status}`);
    }
    return (await res.json()) as ContextItem[];
  } catch (err) {
    console.error('[getContextItems] Unexpected error', err);
    throw err;
  }
}
