import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { listBasketsByWorkspace } from "@/lib/baskets/listBasketsByWorkspace";
import { pickMostRelevantBasket } from "@/lib/baskets/pickMostRelevantBasket";
import { setLastBasketId } from "@/lib/cookies/workspaceCookies";
import { logEvent } from "@/lib/telemetry";

export default async function BasketLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const ws = await getServerWorkspace();
  const { data: baskets, error } = await listBasketsByWorkspace(ws.id);
  if (error) throw error;
  if (!baskets?.length) redirect("/memory"); // upstream will create/resolve

  // Refresh the workspace-scoped cookie on every visit
  const canonical = pickMostRelevantBasket({ baskets, lastBasketId: id }) ?? baskets[0];
  await setLastBasketId(ws.id, canonical.id);

  // Enforce canonical ID → send to Memory (keeps scope consistent)
  if (id !== canonical.id) {
    await logEvent?.("basket.canonical_redirect", {
      workspace_id: ws.id,
      from: id,
      to: canonical.id,
    });
    redirect(`/baskets/${canonical.id}/memory`);
  }

  return <>{children}</>;
}
