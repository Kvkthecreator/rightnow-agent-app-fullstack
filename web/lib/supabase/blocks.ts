// ✅ File: lib/supabase/blocks.ts

import { createClient } from "@/lib/supabaseClient";
import { apiPost, apiPut, apiDelete } from "@/lib/api";

export interface BlockInsert {
  user_id?: string;
  basket_id?: string;
  /**
   * TODO: rename to semantic_type across callers.
   * Accept either `type` or `semantic_type` to satisfy legacy usage.
   */
  type?: string;
  semantic_type?: string;
  label: string;
  content: string;
  state?: string;
  meta_tags?: string[];
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

export async function fetchBlock(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function updateBlock(id: string, updates: Record<string, any>) {
  return apiPut("/api/context-blocks/update", { id, ...updates });
}

export async function deleteBlock(id: string) {
  return apiDelete(`/api/context-blocks/${id}`);
}
