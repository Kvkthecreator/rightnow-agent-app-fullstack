import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Block } from "@/types";

export async function getBlocksServer(basketId: string): Promise<Block[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("id, semantic_type, content, created_at")
    .eq("basket_id", basketId)
    .order("created_at");

  if (error) {
    console.error("[getBlocksServer]", error.message);
    return [];
  }

  return (data ?? []).map((b: any) => ({
    id: b.id,
    type: b.semantic_type,
    content: b.content || "",
    created_at: b.created_at,
  })) as Block[];
}
