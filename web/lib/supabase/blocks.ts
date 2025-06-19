// ✅ File: lib/supabase/blocks.ts

import { createClient } from "@/lib/supabaseClient";
import { apiPost, apiPut } from "@/lib/api";

export interface BlockInsert {
  user_id: string;
  type: string;
  label: string;
  content: string;
  update_policy?: "manual" | "auto";
  is_core_block?: boolean;
  file_ids?: string[];
}

export async function fetchBlocks(
  userId: string,
  coreOnly = false,
  scopes: string[] = ["basket", "profile"]
) {
  const supabase = createClient();
  let query = supabase
    .from("blocks")
    .select("*")
    .eq("user_id", userId);
  if (scopes.length > 0) {
    query = query.in("meta_scope", scopes);
  }
  if (coreOnly) {
    query = query.eq("is_core_block", true);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
}


export async function createBlock(block: BlockInsert) {
  return apiPost("/api/context-blocks/create", block);
}

export async function toggleAuto(id: string, enable: boolean) {
  return apiPut("/api/context-blocks/update", {
    id,
    update_policy: enable ? "auto" : "manual",
  });
}
