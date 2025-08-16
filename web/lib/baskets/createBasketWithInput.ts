import { uploadFile } from "@/lib/uploadFile";
import { createClient } from "@/lib/supabaseClient";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

export interface CreateBasketArgs {
  userId: string;
  text: string;
  files?: (File | string)[];
  name?: string;
}
export async function createBasketWithInput({
  userId,
  text,
  files = [],
  name,
}: CreateBasketArgs) {
  const supabase = createClient();
  // 1️⃣ Core basket creation via privileged API route
  const payload: Record<string, string> = {
    idempotency_key: crypto.randomUUID(),
  };
  if (name) payload.name = name;
  console.log("[createBasketWithInput] Payload:", payload);
  const resp = await fetchWithToken("/api/baskets/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(msg || `createBasket failed (${resp.status})`);
  }
  const result = (await resp.json()) as { basket_id: string };
  const basket = { id: result.basket_id };

  // 2️⃣ File sidecar: decoupled, fail-safe
  if (files?.length) {
    for (const item of files) {
      if (item instanceof File) {
        try {
          const sanitizedName = sanitizeFilename(item.name);
          const filename = `${Date.now()}-${sanitizedName}`;
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
