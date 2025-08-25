import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { BlockDTO } from "@shared/contracts/documents";

export async function getBlocksServer(basketId: string): Promise<Block[]> {
  const supabase = createServerComponentClient({ cookies });
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
