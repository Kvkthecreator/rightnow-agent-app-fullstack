import BasketWorkLayout from "@/components/basket/BasketWorkLayout";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasket } from "@/lib/api/baskets";
import { getDocuments } from "@/lib/api/documents";
import { getBlocks } from "@/lib/api/blocks";
import { redirect } from "next/navigation";

export default async function BasketWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("❌ No user found. Redirecting to login.");
    redirect(`/login?redirect=/baskets/${id}/work`);
  }

  const workspace = await ensureWorkspaceServer(supabase);
  const workspaceId = workspace?.id;

  console.log("🧺 User and Workspace Check:", {
    userId: user?.id,
    workspaceId,
  });

  if (!workspaceId) {
    console.warn("❌ No workspace found. Redirecting to /home.");
    redirect("/home");
  }

  let error = null;
  const basket = await getBasket(id);

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

  const docs = await getDocuments(id);
  const firstDoc = docs ? docs[0] : null;

  let rawDumpBody = "";

  const blocks = await getBlocks(id);
  const anyBlock = blocks && blocks.length > 0 ? blocks[0] : null;

  const isEmpty = !anyBlock && !firstDoc;

  return (
    <BasketWorkLayout
      basketId={id}
      basketName={basket.name ?? "Untitled"}
      status={basket.status ?? "draft"}
      scope={[]} // ✅ Temporarily empty until tags are wired properly
      dumpBody={rawDumpBody}
      empty={isEmpty}
    />
  );
}
