import { createClient } from "@/lib/supabaseClient";
import { uploadFile } from "@/lib/uploadFile";
import { apiPost } from "@/lib/api";

export interface BasketInputPayload {
  text: string;
  files?: File[];
}

export async function createBasketWithInput({ text, files = [] }: BasketInputPayload) {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");
  const userId = userData.user.id;

  const uploadedUrls: string[] = [];
  const fileIds: string[] = [];

  for (const file of files) {
    const filename = `${Date.now()}-${file.name}`;
    const path = `dump_${userId}/${filename}`;
    const url = await uploadFile(file, path, "basket-dumps");
    uploadedUrls.push(url);

    const { data, error } = await supabase
      .from("block_files")
      .insert({
        user_id: userId,
        file_url: url,
        file_name: file.name,
        size_bytes: file.size,
        storage_domain: "basket-dumps",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data) fileIds.push(data.id);
  }

  const { data: basket, error: basketErr } = await supabase
    .from("baskets")
    .insert({
      user_id: userId,
      raw_dump: text,
      media: uploadedUrls,
      is_draft: true,
    })
    .select()
    .single();

  if (basketErr || !basket) throw new Error(basketErr?.message || "basket insert failed");

  const { data: input, error: inputErr } = await supabase
    .from("basket_inputs")
    .insert({
      basket_id: basket.id,
      content: text,
      file_ids: fileIds,
      source: "user",
    })
    .select()
    .single();

  if (inputErr || !input) throw new Error(inputErr?.message || "input insert failed");

  await apiPost("/api/agent-run", {
    agent: "orch_block_manager_agent",
    event: "basket_inputs.created",
    input: { input_id: input.id },
  });

  return basket;
}
