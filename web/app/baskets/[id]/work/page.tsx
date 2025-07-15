import BasketDashboardLayout from "@/components/layouts/BasketDashboardLayout";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { redirect } from "next/navigation";

export default async function BasketWorkPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login");
  }

  const { data: basket, error: basketError } = await supabase
    .from("baskets")
    .select("id, name, state, tags")
    .eq("id", id)
    .single()

  if (!basket) {
    // Disable redirect to inspect error first
    return <div>⚠️ Basket not found for ID: {id}</div>
  }

  const { data: firstDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("basket_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const selectedDocId = firstDoc?.id ?? null
  let rawDumpBody = ""

  if (selectedDocId) {
    const { data: dump } = await supabase
      .from("raw_dumps")
      .select("body_md")
      .eq("document_id", selectedDocId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    rawDumpBody = dump?.body_md ?? ""
  }

  return (
    <BasketDashboardLayout
      basketId={id}
      basketName={basket.name ?? "Untitled"}
      status={basket.state ?? "draft"}
      scope={basket.tags ?? []}
      dumpBody={rawDumpBody}
    />
  )
}
