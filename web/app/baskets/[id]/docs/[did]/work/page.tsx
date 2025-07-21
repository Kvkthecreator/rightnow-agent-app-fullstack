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

  const basket = await getBasket(id);

  console.debug("[DocLoader] Fetched basket:", basket);

  if (!basket) {
    console.warn(
      `[DocLoader] No basket found or not accessible for id=${id}`,
    );
    redirect("/404");
  }

  const documents = await getDocuments(id);

  const dump = await getLatestDump(id);

  const blocks = await getBlocks(id);

  const docGuidelines = await getContextItems(did);

  const snapshot = {
    basket,
    raw_dump_body: dump?.body_md || "",
    file_refs: [],
    blocks: blocks || [],
    proposed_blocks: [],
  };

  const guidelines = docGuidelines || [];

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
