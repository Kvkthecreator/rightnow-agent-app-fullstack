import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Document } from "@/types";

export async function getDocumentsServer(workspaceId: string): Promise<Document[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, created_at, basket_id") // ✅ must include basket_id to satisfy type
    .eq("workspace_id", workspaceId)            // ✅ scoped access via workspace_id (RLS-safe)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getDocumentsServer]", error.message);
    return [];
  }

  return data ?? [];
}
