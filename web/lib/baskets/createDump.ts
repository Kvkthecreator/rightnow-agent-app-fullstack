import { createClient } from "@/lib/supabaseClient";
import { uploadFile } from "@/lib/uploadFile";
import { apiPost } from "@/lib/api";

export interface DumpInput {
  basketId: string;
  text: string;
  images?: File[];
}

export async function createDump({ basketId, text, images = [] }: DumpInput) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");
  const userId = userData.user.id;

  const fileIds: string[] = [];
  const uploadedUrls: string[] = [];
  for (const item of images) {
    const filename = `${Date.now()}-${item.name}`;
    const url = await uploadFile(item, `dump_${userId}/${filename}`, "basket-dumps");
    const name = item.name;
    const size = item.size;
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
    uploadedUrls.push(url);
  }

  const { data: input, error: inputErr } = await supabase
    .from("basket_inputs")
    .insert({
      basket_id: basketId,
      content: text,
      file_ids: fileIds,
      source: "user",
    })
    .select("id")
    .single();

  if (inputErr || !input) throw new Error(inputErr?.message || "input insert failed");

  await apiPost("/api/agent-run", {
    agent: "orch_block_manager_agent",
    event: "basket_inputs.created",
    input: { input_id: input.id, uploaded_images: uploadedUrls },
  });

  return input;
}
