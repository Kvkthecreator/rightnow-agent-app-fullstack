import { createClient } from "@/lib/supabaseClient";
import { uploadFile } from "@/lib/uploadFile";
import { apiPost } from "@/lib/api";

export interface BasketInputPayload {
  text: string;
  files?: (File | string)[];
}

// createBasketWithInput belongs to **Domain 2 — Actual Creation + Agent Trigger**
// of the basket lifecycle. It persists the basket and input records and
// kicks off downstream orchestration.
// Files are uploaded and inserted into `block_files` along the way.
export async function createBasketWithInput({ text, files = [] }: BasketInputPayload) {
  if (!text.trim() && files.length === 0) {
    throw new Error("createBasketWithInput called with empty input.");
  }

  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");
  const userId = userData.user.id;
  // Capture the first line as an "intent" snippet. This is lightweight metadata
  // saved with the basket for later enrichment. It does not alter the original
  // text and is not considered parsing or transformation.
  const name = text.split("\n")[0]?.slice(0, 100) || null;

  const uploadedUrls: string[] = [];
  const fileIds: string[] = [];

  for (const item of files) {
    let url: string;
    let name: string;
    let size = 0;

    if (item instanceof File) {
      // Upload raw files using the canonical bucket used for block creation.
      const filename = `${Date.now()}-${item.name}`;
      url = await uploadFile(
        item,
        `dump_${userId}/${filename}`,
        "block-files",
      );
      name = item.name;
      size = item.size;
    } else {
      url = item;
      name = item.split("/").pop() || "file";
    }

    uploadedUrls.push(url);

    const { data, error } = await supabase
      .from("block_files")
      .insert({
        user_id: userId,
        file_url: url,
        file_name: name,
        label: name, // block_files.label is required
        size_bytes: size,
        storage_domain: "block-files",
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
      name,
      status: "draft",
      tags: [],
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
