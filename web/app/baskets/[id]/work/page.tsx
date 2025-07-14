import WorkbenchLayout from "@/components/workbench/WorkbenchLayout";
import ContextBlocksPanel from "@/components/context/ContextBlocksPanel";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BasketWorkPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, raw_dump_id")
    .eq("id", id)
    .single();
  if (!basket) {
    redirect("/404");
  }
  const { data: dump } = await supabase
    .from("raw_dumps")
    .select("body_md")
    .eq("id", basket.raw_dump_id)
    .single();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, semantic_type, content, state, scope, canonical_value, actor, created_at")
    .eq("basket_id", id)
    .in("state", ["LOCKED", "PROPOSED", "CONSTANT"]);

  const { data: contextItems } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .eq("status", "active");

  const snapshot = {
    basket,
    raw_dump_body: dump?.body_md || "",
    file_refs: [],
    blocks: blocks || [],
    proposed_blocks: [],
  };

  return (
    <WorkbenchLayout
      snapshot={snapshot}
      rightPanel={
        <ContextBlocksPanel blocks={blocks || []} contextItems={contextItems || []} />
      }
    />
  );
}
