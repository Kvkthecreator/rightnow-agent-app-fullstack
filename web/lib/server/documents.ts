import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import type { DocumentDTO } from "@/shared/contracts/documents";

export async function getDocumentsServer(workspaceId: string): Promise<DocumentDTO[]> {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from("document_heads")
    .select("document_id, title, basket_id, document_type, current_version_hash, document_metadata, document_updated_at, version_created_at")
    .eq("workspace_id", workspaceId)
    .order("version_created_at", { ascending: true });

  if (error) {
    console.error("[getDocumentsServer]", error.message);
    return [];
  }

  return (data || []).map((doc: any) => ({
    id: doc.document_id,
    basket_id: doc.basket_id,
    title: doc.title,
    doc_type: doc.document_type || 'artifact_other',
    current_version_hash: doc.current_version_hash,
    latest_version_created_at: doc.version_created_at || doc.document_updated_at,
    updated_at: doc.document_updated_at ?? doc.version_created_at,
    metadata: doc.document_metadata || {},
  }));
}
