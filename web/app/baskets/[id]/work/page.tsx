import BasketWorkLayout from "@/components/layouts/BasketWorkLayout";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function BasketWorkPage({ params }: PageProps) {
  const { id } = params;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/baskets/${id}/work`);
  }

  const workspace = await getServerWorkspace();
  const workspaceId = workspace?.id;
  if (!workspaceId) {
    redirect("/home");
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (!basket) {
    redirect("/404");
  }

  const { data: firstDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: anyDump } = await supabase
    .from("raw_dumps")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rawDumpBody = "";
  if (firstDoc?.id) {
    const { data: dump } = await supabase
      .from("raw_dumps")
      .select("body_md")
      .eq("document_id", firstDoc.id)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    rawDumpBody = dump?.body_md ?? "";
  }

  const { data: anyBlock } = await supabase
    .from("blocks")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  const isEmpty = !anyBlock && !firstDoc && !anyDump;

  return (
    <BasketWorkLayout
      basketId={id}
      basketName={basket.name ?? "Untitled"}
      status={basket.status ?? "draft"}
      scope={basket.tags ?? []}
      dumpBody={rawDumpBody}
      empty={isEmpty}
    />
  );
}

