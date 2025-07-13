import WorkbenchLayoutDev from "@/components/workbench/WorkbenchLayoutDev";
import RightPanelTabs from "@/components/workbench/RightPanelTabs";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; did: string }>;
}

export default async function DocWorkPage({ params }: PageProps) {
  const { id, did } = await params;
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!basket) {
    redirect("/404");
  }

  const { data: dump } = await supabase
    .from("raw_dumps")
    .select("body_md")
    .eq("document_id", did)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: blocks } = await supabase
    .from("blocks")
    .select(
      "id, semantic_type, content, state, scope, canonical_value, actor, created_at"
    )
    .eq("basket_id", id)
    .in("state", ["LOCKED", "PROPOSED", "CONSTANT"]);

  const { data: basketGuidelines } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .is("document_id", null)
    .eq("status", "active");

  const { data: docGuidelines } = await supabase
    .from("context_items")
    .select("id, content")
    .eq("basket_id", id)
    .eq("document_id", did)
    .eq("status", "active");

  const snapshot = {
    basket,
    raw_dump_body: dump?.body_md || "",
    blocks: blocks || [],
  };

  const guidelines = [...(basketGuidelines || []), ...(docGuidelines || [])];

  return (
    <WorkbenchLayoutDev
      initialSnapshot={snapshot}
      rightPanel={
        <RightPanelTabs
          basketId={id}
          blocks={blocks || []}
          contextItems={guidelines}
        />
      }
    />
  );
}
