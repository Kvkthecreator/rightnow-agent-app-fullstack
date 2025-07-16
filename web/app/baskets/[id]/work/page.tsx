import BasketDashboardLayout from "@/components/layouts/BasketDashboardLayout"
import { createServerSupabaseClient } from "@/lib/supabaseServerClient"
import { getOrCreateWorkspaceId } from "@/lib/workspaces"
import { redirect } from "next/navigation"

// ✅ Next.js 15 requires params to be a Promise
export default async function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // ✅ Await the promised params

  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const workspaceId = await getOrCreateWorkspaceId(supabase, user?.id!)

  if (!user) {
    redirect("/login")
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single()

  if (!basket) {
    console.log("🔍 basket fetch failed — possible RLS or auth issue")
    console.log("user", user)
    console.log("user id", user?.id)
    redirect("/404")
  }


  const { data: firstDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  let rawDumpBody = ""

  if (firstDoc?.id) {
    const { data: dump } = await supabase
      .from("raw_dumps")
      .select("body_md")
      .eq("document_id", firstDoc.id)
      .eq("workspace_id", workspaceId)
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
