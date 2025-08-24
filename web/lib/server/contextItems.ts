import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { ContextItem } from "@shared/contracts/context";

export async function getContextItemsServer(docId?: string): Promise<ContextItem[]> {
  const supabase = createServerComponentClient({ cookies });
  let query = supabase.from("context_items").select("id,document_id,title,summary");
  if (docId) {
    query = query.eq("document_id", docId);
  }
  const { data, error } = await query.order("created_at");
  if (error) {
    console.error("[getContextItemsServer]", error.message);
    return [];
  }
  return data ?? [];
}
