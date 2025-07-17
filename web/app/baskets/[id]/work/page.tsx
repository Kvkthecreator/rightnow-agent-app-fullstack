import BasketWorkLayout from "@/components/layouts/BasketWorkLayout"
import { createServerSupabaseClient } from "@/lib/supabaseServerClient"
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace"
import { redirect } from "next/navigation"

// ✅ Next.js 15 requires params to be a Promise
export default async function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // ✅ Await the promised params
  console.debug("[BasketLoader] basket id", id)

  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.debug("[BasketLoader] User:", user)

  if (!user) {
    redirect("/login")
  }

  const workspace = await getServerWorkspace()
  const workspaceId = workspace?.id
  console.debug("[BasketLoader] Workspace ID:", workspaceId)

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single()

  console.debug("[BasketLoader] Fetched basket:", basket)

  if (!basket) {
    console.warn(
      `[BasketLoader] No basket found or not accessible for id=${id}`,
    )
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

  const { data: anyDump } = await supabase
    .from("raw_dumps")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

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

  const { data: anyBlock } = await supabase
    .from("blocks")
    .select("id")
    .eq("basket_id", id)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle()

  const isEmpty = !anyBlock && !firstDoc && !anyDump

  return (
    <BasketWorkLayout
      basketId={id}
      basketName={basket.name ?? "Untitled"}
      status={basket.status ?? "draft"}
      scope={basket.tags ?? []}
      dumpBody={rawDumpBody}
      empty={isEmpty}
    />
  )
}
