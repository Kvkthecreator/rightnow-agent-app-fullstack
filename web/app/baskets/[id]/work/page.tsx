import BasketWorkLayout from "@/components/layouts/BasketWorkLayout";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { redirect } from "next/navigation";

// ✅ Next.js 15 note:
// `params` is now passed as a Promise due to streaming + layout changes.
// Do NOT redefine `PageProps` manually — Next.js auto-generates one.
// Instead, destructure and await it here inline as shown below.

export default async function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>; // ✅ Required in Next.js 15 for streamed routes
}) {
  const { id } = await params;

  // ✅ Supabase client is created using dynamic cookies — safe for App Router
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("❌ No user found. Redirecting to login.");
    redirect(`/login?redirect=/baskets/${id}/work`);
  }

  const workspace = await getServerWorkspace();
  const workspaceId = workspace?.id;

  console.log("🧺 User and Workspace Check:", {
    userId: user?.id,
    workspaceId,
  });

  if (!workspaceId) {
    console.warn("❌ No workspace found. Redirecting to /home.");
    redirect("/home");
  }

  const { data: basket } = await supabase
    .from("baskets")
    .select("id, name, status, tags")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();

  if (!basket) {
    console.warn("❌ Basket not found — skipping redirect for debug.", {
      basketId: id,
      workspaceId,
    });
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-xl font-bold">🧪 DEBUG MODE</h1>
        <p>Basket not found: <code>{id}</code></p>
        <p>Workspace: <code>{workspaceId}</code></p>
      </div>
    );
  }

  console.log("✅ Basket loaded:", basket);

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
