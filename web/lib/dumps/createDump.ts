import { apiClient } from "@/lib/api/client";

export async function createDump(
  basketId: string,
  textDump: string,
  fileUrl?: string,
): Promise<{ id: string; basket_id: string; text_dump: string | null; created_at: string }> {
  const dumpRequestId = crypto.randomUUID();

  return apiClient.request<{ id: string; basket_id: string; text_dump: string | null; created_at: string }>("/api/dumps/new", {
    method: "POST",
    body: JSON.stringify({
      basket_id: basketId,
      dump_request_id: dumpRequestId,
      text_dump: textDump, // Map body_md → text_dump for backend
      ...(fileUrl ? { file_url: fileUrl } : {}),
    }),
  });
}
