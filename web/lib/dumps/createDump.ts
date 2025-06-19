import { Database } from "../dbTypes";

export async function createDump(basketId: string, text_dump: string, file_urls: string[] = []): Promise<{ raw_dump_id: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dumps/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basket_id: basketId, text_dump, file_urls }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { raw_dump_id: string };
}
