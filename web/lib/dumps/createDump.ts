import { apiPost } from "@/lib/api";

export async function createDump(
  basketId: string,
  body_md: string,
  file_refs: string[] = [],
): Promise<{ raw_dump_id: string }> {
  return apiPost<{ raw_dump_id: string }>("/dumps/new", {
    basket_id: basketId,
    body_md,
    file_refs,
  });
}
