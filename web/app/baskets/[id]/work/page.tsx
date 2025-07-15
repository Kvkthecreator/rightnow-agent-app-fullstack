
import WorkbenchLayout from "@/components/basket/WorkbenchLayout";
import ContextBlocksPanel from "@/components/basket/ContextBlocksPanel";

import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>; // ✅ Next.js 15 expects this to be async
}

export default async function BasketWorkPage({ params }: PageProps) {
  const { id } = await params; // ✅ Correct usage for Next.js 15

  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, created_at")
    .eq("id", id)
    .single();

  if (!basket) {
    redirect("/404");
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title")
    .eq("basket_id", id);

  const { data: firstDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("basket_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const selectedDocId = firstDoc?.id ?? null;

  let rawDumpBody = "";
  if (selectedDocId) {
    const { data: dump } = await supabase
      .from("raw_dumps")
      .select("body_md")
      .eq("document_id", selectedDocId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    rawDumpBody = dump?.body_md ?? "";
  }

  const { data: blocks } = await supabase
    .from("blocks")
    .select(
      "id, semantic_type, content, state, scope, canonical_value, actor, created_at"
    )
    .eq("basket_id", id)
    .in("state", ["LOCKED", "PROPOSED", "CONSTANT"]);

  const { data: basketItems } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .is("document_id", null)
    .eq("status", "active");

  const { data: docItems } = selectedDocId
    ? await supabase
        .from("context_items")
        .select("id, content")
        .eq("basket_id", id)
        .eq("document_id", selectedDocId)
        .eq("status", "active")
    : { data: [] };

  const contextItems = [...(basketItems ?? []), ...(docItems ?? [])];

  const snapshot = {
    basket: {
      ...basket,
      created_at: basket.created_at ?? new Date().toISOString(),
    },
    raw_dump_body: rawDumpBody,
    file_refs: [],
    blocks: blocks || [],
    proposed_blocks: [],
  };

  return (
    <WorkbenchLayout
      snapshot={snapshot}
      documentId={selectedDocId ?? undefined}
      documents={documents || []}
      rightPanel={
        <ContextBlocksPanel
          basketId={id}
          documentId={selectedDocId ?? undefined}
          blocks={blocks || []}
          contextItems={contextItems}
        />
      }
    />
  );
}
