import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { ContextItem } from "@shared/contracts/context";

export async function getContextItemsServer(docId?: string): Promise<ContextItem[]> {
  const supabase = createServerComponentClient({ cookies });
  let query = supabase.from("context_items").select("id,basket_id,document_id,type,content,title,description,status");
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
