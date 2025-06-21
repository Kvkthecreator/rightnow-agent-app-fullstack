// web/lib/baskets/getSnapshot.ts
import { fetchWithToken } from "@/lib/fetchWithToken";

/** Shape returned by /api/baskets/{id}/snapshot */
export interface BasketSnapshot {
  basket: {
    id: string;
    name: string | null;
    created_at: string;
  };
  raw_dump_body: string;
  file_refs: string[];
  blocks: {
    id: string;
    semantic_type: string;
    content: string;
    state: string;
    scope: string | null;
    canonical_value: string | null;
  }[];
}

const SNAPSHOT_PATH = "snapshot";               // route segment

export async function getSnapshot(id: string): Promise<BasketSnapshot> {
  // NOTE: fetchWithToken itself prepends API_ORIGIN, so we pass a bare path.
  const res = await fetchWithToken(`/api/baskets/${id}/${SNAPSHOT_PATH}`);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `snapshot fetch failed (${res.status})`);
  }
  return (await res.json()) as BasketSnapshot;
}
