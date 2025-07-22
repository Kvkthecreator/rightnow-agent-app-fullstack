import BasketWorkLayout from "@/components/basket/BasketWorkLayout";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasketServer } from "@/lib/server/baskets";
import { getDocumentsServer } from "@/lib/server/documents";
import { getBlocksServer } from "@/lib/server/blocks";
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
  const basket = await getBasketServer(id, workspaceId);

  if (!basket) {
    console.warn("❌ Basket not found", { basketId: id, workspaceId });
    redirect("/404");
  }

  console.log("✅ Basket loaded:", basket);

  const docs = await getDocumentsServer(workspaceId);
  const firstDoc = docs ? docs[0] : null;

  let rawDumpBody = "";

  const blocks = await getBlocksServer(id);
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
