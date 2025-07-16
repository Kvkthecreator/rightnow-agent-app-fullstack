import DocumentWorkbenchLayout from "@/components/layouts/DocumentWorkbenchLayout";
import ContextBlocksPanel from "@/components/basket/ContextBlocksPanel";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getActiveWorkspaceId } from "@/lib/workspace";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; did: string }>;
}

export default async function DocWorkPage({ params }: PageProps) {
  const { id, did } = await params;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const workspaceId = await getActiveWorkspaceId(supabase, user?.id);

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  if (!basket) {
    redirect("/404");
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId);

  const { data: dump } = await supabase
    .from("raw_dumps")
    .select("body_md")
    .eq("document_id", did)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: blocks } = await supabase
    .from("blocks")
    .select(
      "id, semantic_type, content, state, scope, canonical_value, actor, created_at"
    )
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .in("state", ["LOCKED", "PROPOSED", "CONSTANT"]);

  const { data: basketGuidelines } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .is("document_id", null)
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  const { data: docGuidelines } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .eq("document_id", did)
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  const snapshot = {
    basket,
    raw_dump_body: dump?.body_md || "",
    file_refs: [],
    blocks: blocks || [],
    proposed_blocks: [],
  };

  const guidelines = [...(basketGuidelines || []), ...(docGuidelines || [])];

  return (
    <DocumentWorkbenchLayout
      snapshot={snapshot}
      documentId={did}
      documents={documents || []}
      rightPanel={
        <ContextBlocksPanel
          basketId={id}
          documentId={did}
          blocks={blocks || []}
          contextItems={guidelines}
        />
      }
    />
  );
}
