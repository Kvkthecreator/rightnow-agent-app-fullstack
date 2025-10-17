import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { DocumentDTO } from "@/shared/contracts/documents";

export async function getDocumentsServer(workspaceId: string): Promise<DocumentDTO[]> {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from("document_heads")
    .select("document_id, title, basket_id, doc_type, current_version_hash, document_metadata, document_updated_at, latest_version_created_at")
    .eq("workspace_id", workspaceId)
    .order("latest_version_created_at", { ascending: true });

  if (error) {
    console.error("[getDocumentsServer]", error.message);
    return [];
  }

  return (data || []).map((doc: any) => ({
    id: doc.document_id,
    basket_id: doc.basket_id,
    title: doc.title,
    doc_type: doc.doc_type,
    current_version_hash: doc.current_version_hash,
    latest_version_created_at: doc.latest_version_created_at,
    updated_at: doc.document_updated_at ?? doc.latest_version_created_at,
    metadata: doc.document_metadata || {},
  }));
}
