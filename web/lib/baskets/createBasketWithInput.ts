import { uploadFile } from "@/lib/uploadFile";
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { apiUrl } from "@/lib/api";

export interface CreateBasketArgs {
  userId: string;
  text: string;
  files?: (File | string)[];
}
export async function createBasketWithInput({
  userId,
  text,
  files = [],
}: CreateBasketArgs) {
  const supabase = createClient();
  // 1️⃣ Core basket creation via privileged API route
  const payload = { text_dump: text, file_urls: [] as string[] };
  console.log("[createBasketWithInput] Payload:", payload);
  const resp = await fetchWithToken(apiUrl("/api/baskets/new"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(msg || `createBasket failed (${resp.status})`);
  }
  const basket = (await resp.json()) as { id: string };

  // 2️⃣ File sidecar: decoupled, fail-safe
  if (files?.length) {
    for (const item of files) {
      if (item instanceof File) {
        try {
          const filename = `${Date.now()}-${item.name}`;
          const url = await uploadFile(
            item,
            `dump_${userId}/${filename}`,
            "block-files",
          );
          await supabase
            .from("block_files")
            .insert({
              user_id: userId,
              file_url: url,
              file_name: item.name,
              label: item.name,
              size_bytes: item.size,
              storage_domain: "block-files",
            });
        } catch (err) {
          console.warn("File upload or insert failed:", err);
          // TODO: Optionally send telemetry
        }
      }
    }
  }

  return basket;
}
