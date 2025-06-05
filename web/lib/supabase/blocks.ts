import { createClient } from "@/lib/supabaseClient";

export interface BlockInsert {
  user_id: string;
  type: string;
  label: string;
  content: string;
  update_policy?: "manual" | "auto";
  is_core_block?: boolean;
  file_ids?: string[];
}

export async function fetchBlocks(userId: string, coreOnly = false) {
  const supabase = createClient();
  let query = supabase
    .from("context_blocks")
    .select("*")
    .eq("user_id", userId);
  if (coreOnly) {
    query = query.eq("is_core_block", true);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
}

export const getBlocks = fetchBlocks;

export async function createBlock(block: BlockInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("context_blocks")
    .insert(block)
    .select()
    .single();
  return { data, error };
}

export async function toggleAuto(id: string, enable: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("context_blocks")
    .update({ update_policy: enable ? "auto" : "manual" })
    .eq("id", id);
  return { error };
}
