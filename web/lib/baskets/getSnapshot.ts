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

const API = process.env.NEXT_PUBLIC_API_URL!;   // e.g. https://api.yarnnn.com
const SNAPSHOT_PATH = "snapshot";               // route segment

export async function getSnapshot(id: string): Promise<BasketSnapshot> {
  const url = `${API}/api/baskets/${id}/${SNAPSHOT_PATH}`;

  const res = await fetchWithToken(url);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `snapshot fetch failed (${res.status})`);
  }
  return (await res.json()) as BasketSnapshot;
}
