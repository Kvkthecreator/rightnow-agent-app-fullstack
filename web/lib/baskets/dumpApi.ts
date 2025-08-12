import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiClient } from "@/lib/api/client";

interface PostDumpArgs {
  basketId: string;
  userId: string;
  text?: string;
  images?: File[];
}

interface DumpResponse {
  input_id: string;
  chunk_ids: string[];
  intent?: string;
  confidence?: number;
  warning?: string;
}

export async function postDump({
  basketId,
  userId,
  text,
  images = [],
}: PostDumpArgs): Promise<DumpResponse> {
  const form = new FormData();
  form.append("basket_id", basketId);
  form.append("user_id", userId);
  if (text) form.append("text", text);
  for (const img of images) form.append("file", img, img.name);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';
  const res = await fetchWithToken(`${API_BASE_URL}/api/dump`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Dump upload failed (${res.status})`);
  }
  return (await res.json()) as DumpResponse;
}

