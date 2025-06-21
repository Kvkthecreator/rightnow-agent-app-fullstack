import { Database } from "../dbTypes";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { withApiOrigin } from "@/lib/apiOrigin";

export async function createDump(basketId: string, text_dump: string, file_urls: string[] = []): Promise<{ raw_dump_id: string }> {
  const res = await fetchWithToken(withApiOrigin("/api/dumps/new"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basket_id: basketId, text_dump, file_urls }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { raw_dump_id: string };
}
