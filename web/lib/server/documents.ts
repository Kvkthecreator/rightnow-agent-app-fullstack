import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Document } from "@/types";

export async function getDocumentsServer(basketId: string): Promise<Document[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id,title,basket_id")
    .eq("basket_id", basketId)
    .order("created_at");
  if (error) {
    console.error("[getDocumentsServer]", error.message);
    return [];
  }
  return data ?? [];
}
