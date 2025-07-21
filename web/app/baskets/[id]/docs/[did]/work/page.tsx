import DocumentWorkbenchLayout from "@/components/document/DocumentWorkbenchLayout";
import ContextBlocksPanel from "@/components/document/ContextBlocksPanel";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasket } from "@/lib/api/baskets";
import { getDocuments } from "@/lib/api/documents";
import { getLatestDump } from "@/lib/api/dumps";
import { getBlocks } from "@/lib/api/blocks";
import { getContextItems } from "@/lib/api/contextItems";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; did: string }>;
}

export default async function DocWorkPage({ params }: PageProps) {
  const { id, did } = await params;
  console.debug("[DocLoader] basket", id, "document", did);
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.debug("[DocLoader] User:", user);
  if (!user) {
    redirect(`/login?redirect=/baskets/${id}/docs/${did}/work`);
  }
  const workspace = await ensureWorkspaceServer(supabase);
  const workspaceId = workspace?.id;
  console.debug("[DocLoader] Workspace ID:", workspaceId);

  const { data: basket } = await getBasket(supabase, id, workspaceId);

  console.debug("[DocLoader] Fetched basket:", basket);

  if (!basket) {
    console.warn(
      `[DocLoader] No basket found or not accessible for id=${id}`,
    );
    redirect("/404");
  }

  const { data: documents } = await getDocuments(supabase, id, workspaceId);

  const { data: dump } = await getLatestDump(
    supabase,
    id,
    workspaceId,
    did,
  );

  const { data: blocks } = await getBlocks(supabase, id, workspaceId);

  const { data: basketGuidelines } = await getContextItems(
    supabase,
    id,
    null,
    workspaceId,
  );
  const { data: docGuidelines } = await getContextItems(
    supabase,
    id,
    did,
    workspaceId,
  );

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
