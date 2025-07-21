import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Block } from "@/types";

export async function getBlocksServer(basketId: string): Promise<Block[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("id,document_id,semantic_type: type,content")
    .eq("basket_id", basketId)
    .order("created_at");
  if (error) {
    console.error("[getBlocksServer]", error.message);
    return [];
  }
  return (data ?? []).map((b: any) => ({
    id: b.id,
    document_id: b.document_id || undefined,
    type: b.semantic_type,
    content: b.content || "",
  })) as Block[];
}
