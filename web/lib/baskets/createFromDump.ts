import { createClient } from "@/lib/supabaseClient";
import { uploadFile } from "@/lib/uploadFile";
import { triggerBlockParser } from "@/lib/agents/triggerBlockParser";
import { apiPost } from "@/lib/api";

export interface DumpPayload {
  textDump: string;
  files: (File | string)[];
  links: string[];
}

export async function createBasketFromDump({
  textDump,
  files,
  links,
}: DumpPayload): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");
  const userId = userData.user.id;

  const uploaded: { file_url: string; file_name: string; size_bytes: number }[] = [];
  const fileIds: string[] = [];

  for (const item of files) {
    let url: string;
    let name: string;
    let size = 0;
    if (item instanceof File) {
      const filename = `${Date.now()}-${item.name}`;
      url = await uploadFile(item, `dump_${userId}/${filename}`, "basket-dumps");
      name = item.name;
      size = item.size;
    } else {
      url = item;
      name = url.split("/").pop() || "file";
    }
    const { data, error } = await supabase
      .from("block_files")
      .insert({
        user_id: userId,
        file_url: url,
        file_name: name,
        size_bytes: size,
        storage_domain: "basket-dumps",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data) fileIds.push(data.id);
    uploaded.push({ file_url: url, file_name: name, size_bytes: size });
  }

  const { id: basketId } = await apiPost<{ id: string }>(
    "/api/baskets/create-with-input",
    { userId, text: textDump, basketName: null },
  );

  await supabase.from("basket_inputs").insert({
    basket_id: basketId,
    content: textDump,
    file_ids: fileIds,
    links,
    source: "user",
  });

  await triggerBlockParser(basketId, { raw_dump: textDump, media: uploaded });

  return { id: basketId };
}
