import { uploadFile } from "@/lib/uploadFile";
import { createClient } from "@/lib/supabaseClient";
import { apiPost } from "@/lib/api";

export interface CreateBasketArgs {
  userId: string;
  text: string;
  files?: (File | string)[];
  basketName?: string | null;
}
export async function createBasketWithInput({
  userId,
  text,
  files = [],
  basketName,
}: CreateBasketArgs) {
  const supabase = createClient();
  // 1️⃣ Core basket creation via privileged API route
  const basket = await apiPost<{ id: string }>("/api/baskets/create-with-input", {
    userId,
    text,
    basketName,
  });

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
