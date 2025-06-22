import { apiPost } from "@/lib/api";

export async function createDump(
  basketId: string,
  text_dump: string,
  file_urls: string[] = [],
): Promise<{ raw_dump_id: string }> {
  return apiPost<{ raw_dump_id: string }>("/api/dumps/new", {
    basket_id: basketId,
    text_dump,
    file_urls,
  });
}
