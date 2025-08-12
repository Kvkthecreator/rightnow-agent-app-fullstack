import { apiClient } from "@/lib/api/client";

export async function createDump(
  basketId: string,
  body_md: string,
  file_refs: string[] = [],
): Promise<{ raw_dump_id: string }> {
  return apiClient.request<{ raw_dump_id: string }>("/api/dumps/new", {
    method: "POST",
    body: JSON.stringify({
      basket_id: basketId,
      text_dump: body_md,  // Map body_md → text_dump for backend
      file_urls: file_refs || []  // Map file_refs → file_urls for backend
    })
  });
}
