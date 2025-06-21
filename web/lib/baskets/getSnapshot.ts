import { fetchWithToken } from "@/lib/fetchWithToken";
export interface BasketSnapshot {
  basket: { id: string; name: string | null; created_at: string };
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
export async function getSnapshot(id: string) {
  const res = await fetchWithToken(
    `${process.env.NEXT_PUBLIC_API_URL}/baskets/${id}/snapshot`
  );
  if (!res.ok) throw new Error("snapshot fetch failed");
  return (await res.json()) as BasketSnapshot;
}
