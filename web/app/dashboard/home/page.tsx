import { redirect } from "next/navigation";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { listBasketsByWorkspace } from "@/lib/baskets/listBasketsByWorkspace";
import { getOrCreateDefaultBasket } from "@/lib/baskets/getOrCreateDefaultBasket";
import { pickMostRelevantBasket } from "@/lib/baskets/pickMostRelevantBasket";
import { getLastBasketId, setLastBasketId } from "@/lib/cookies/workspaceCookies";
import { logEvent } from "@/lib/telemetry";

export default async function DashboardHomeRedirect() {
  const ws = await getServerWorkspace(); // throws → 401/redirect

  const { data: baskets, error } = await listBasketsByWorkspace(ws.id);
  if (error) {
    // Let this surface as 500; it means schema/outage, which we must see.
    throw error;
  }

  if (!baskets.length) {
    try {
      const created = await getOrCreateDefaultBasket({
        workspaceId: ws.id,
        idempotencyKey: `first-run::${ws.id}`,
        name: process.env.DEFAULT_BASKET_NAME ?? "Your Memory",
      });
      await setLastBasketId(ws.id, created.id);
      await logEvent("basket.autocreate", { workspace_id: ws.id, basket_id: created.id });
      redirect(`/baskets/${created.id}/memory`);
    } catch (e: any) {
      // Single fallback path for known races (conflict/already-exists)
      await logEvent("redirect.create_conflict_fallback", { workspace_id: ws.id });
      redirect("/memory"); // will resolve to the (now-existing) basket
    }
  }

  const last = await getLastBasketId(ws.id);
  const target = pickMostRelevantBasket({ baskets, lastBasketId: last });
  if (!target) {
    // Shouldn't happen with non-empty list; surface to logs if it does.
    throw new Error("No target basket resolved");
  }

  await setLastBasketId(ws.id, target.id);
  await logEvent("basket.resolve_target", { workspace_id: ws.id, basket_id: target.id });
  redirect(`/baskets/${target.id}/memory`);
}
