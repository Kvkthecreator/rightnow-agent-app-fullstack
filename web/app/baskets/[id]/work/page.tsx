import BasketDashboardLayout from "@/components/layouts/BasketDashboardLayout"
import { createServerSupabaseClient } from "@/lib/supabaseServerClient"
import { redirect } from "next/navigation"

// ✅ No manual interface or Promise typing
export default async function BasketWorkPage({ params }: { params: { id: string } }) {
  const { id } = params

  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .single()

  if (!basket) {
    redirect("/404")
  }

  const { data: firstDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("basket_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  let rawDumpBody = ""

  if (firstDoc?.id) {
    const { data: dump } = await supabase
      .from("raw_dumps")
      .select("body_md")
      .eq("document_id", firstDoc.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    rawDumpBody = dump?.body_md ?? ""
  }

  return (
    <BasketDashboardLayout
      basketId={id}
      basketName={basket.name ?? "Untitled"}
      status={basket.status ?? "draft"}
      scope={basket.tags ?? []}
      dumpBody={rawDumpBody}
    />
  )
}
