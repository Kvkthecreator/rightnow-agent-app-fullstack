import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { DocumentDTO } from "@/shared/contracts/documents";

export async function getDocumentsServer(workspaceId: string): Promise<DocumentDTO[]> {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, created_at, updated_at, basket_id, metadata")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getDocumentsServer]", error.message);
    return [];
  }

  return data ?? [];
}
