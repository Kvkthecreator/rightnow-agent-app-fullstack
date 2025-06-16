import { uploadFile } from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";

export async function createBasketWithInput({ userId, text, files, basketName }) {
  // 1️⃣ Core basket creation
  const { data: basket, error: basketError } = await supabase
    .from("baskets")
    .insert({ user_id: userId, name: basketName })
    .select("*")
    .single();
  if (basketError) throw basketError;

  const { error: inputError } = await supabase
    .from("basket_inputs")
    .insert({
      basket_id: basket.id,
      text_dump: text,
    });
  if (inputError) throw inputError;

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
