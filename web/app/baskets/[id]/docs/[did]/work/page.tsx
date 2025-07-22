import DocumentWorkbenchLayout from "@/components/document/DocumentWorkbenchLayout";
import ContextBlocksPanel from "@/components/document/ContextBlocksPanel";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasketServer } from "@/lib/server/baskets";
import { getDocumentsServer } from "@/lib/server/documents";
import { getLatestDumpServer } from "@/lib/server/dumps";
import { getBlocksServer } from "@/lib/server/blocks";
import { getContextItemsServer } from "@/lib/server/contextItems";
import type { Block } from "@/types";
import { redirect } from "next/navigation";

type BlockRow = Block & {
  state: string;
};

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

  const basket = await getBasketServer(id, workspaceId ?? "");

  console.debug("[DocLoader] Fetched basket:", basket);

  if (!basket) {
    console.warn(
      `[DocLoader] No basket found or not accessible for id=${id}`,
    );
    redirect("/404");
  }

  const documents = await getDocumentsServer(workspaceId ?? "");

  const dump = await getLatestDumpServer(id);

  const blocks = await getBlocksServer(id);
  const blocksWithState: BlockRow[] = (blocks || []).map((b) => ({
    ...b,
    state: "idle",
  }));

  const docGuidelines = await getContextItemsServer(did);

  const snapshot = {
    basket,
    raw_dump_body: dump?.body_md || "",
    file_refs: [],
    blocks: blocksWithState,
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
          blocks={blocksWithState}
          contextItems={guidelines}
        />
      }
    />
  );
}
