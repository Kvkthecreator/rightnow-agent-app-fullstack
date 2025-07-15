import BasketDashboardLayout from "@/components/layouts/BasketDashboardLayout"
import { createServerSupabaseClient } from "@/lib/supabaseServerClient"
import { redirect } from "next/navigation"

// Remove custom interface
// interface BasketWorkPageProps { ... }

// Use Next.js built-in PageProps type
export default async function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // ✅ Fixed: await the params Promise

  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("\ud83d\udd10 Supabase session:", session)

  if (!session) {
    redirect("/login")
  }

  const { data: basket, error: basketError } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .single()

  console.log("\ud83e\uddfa Basket ID param:", id)
  console.log("\ud83d\uddde Supabase basket query result:", basket)
  console.log("\u2757 Supabase basket query error:", basketError)

  if (!basket) {
    // Temporarily disable redirect to see logs clearly
    return <div>\u26a0\ufe0f Basket not found for ID: {id}</div>
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
      status={basket.status ?? "draft"}
      scope={basket.tags ?? []}
      dumpBody={rawDumpBody}
    />
  )
}
