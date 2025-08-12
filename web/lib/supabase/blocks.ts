
import { createClient } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/api/client";

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
  workspaceId: string,
  coreOnly = false,
  scopes: string[] = ["basket", "profile"]
) {
  const supabase = createClient();
  let query = supabase
    .from("blocks")
    .select("*")
    .eq("workspace_id", workspaceId);
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
  return apiClient.request("/api/context-blocks/create", {
    method: "POST",
    body: JSON.stringify(block)
  });
}

export async function toggleAuto(id: string, enable: boolean) {
  return apiClient.request("/api/context-blocks/update", {
    method: "PUT",
    body: JSON.stringify({
      id,
      update_policy: enable ? "auto" : "manual",
    })
  });
}

export async function fetchBlock(id: string, workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  return { data, error };
}

export async function updateBlock(id: string, updates: Record<string, any>) {
  return apiClient.request("/api/context-blocks/update", {
    method: "PUT",
    body: JSON.stringify({ id, ...updates })
  });
}

export async function deleteBlock(id: string) {
  return apiClient.request(`/api/context-blocks/${id}`, {
    method: "DELETE"
  });
}
