import { NextResponse } from "next/server";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { listBasketsByWorkspace } from "@/lib/baskets/listBasketsByWorkspace";
import { getLastBasketId, setLastBasketId } from "@/lib/cookies/workspaceCookies";
import { getOrCreateDefaultBasket } from "@/lib/baskets/getOrCreateDefaultBasket";
import { pickMostRelevantBasket } from "@/lib/baskets/pickMostRelevantBasket";
import { logEvent } from "@/lib/telemetry";

export async function POST() {
  const ws = await getServerWorkspace();
  const { data: baskets, error } = await listBasketsByWorkspace(ws.id);
  if (error) throw error;

  if (!baskets.length) {
    const created = await getOrCreateDefaultBasket({
      workspaceId: ws.id,
      idempotencyKey: `first-run::${ws.id}`,
      name: process.env.DEFAULT_BASKET_NAME ?? "Personal Memory",
    });
    await setLastBasketId(ws.id, created.id);
    await logEvent("basket.autocreate", { workspace_id: ws.id, basket_id: created.id });
    return NextResponse.json({ id: created.id });
  }

  const last = await getLastBasketId(ws.id);
  const target = pickMostRelevantBasket({ baskets, lastBasketId: last });
  await setLastBasketId(ws.id, target.id);
  await logEvent("basket.pick_target", { workspace_id: ws.id, basket_id: target.id });
  return NextResponse.json({ id: target.id });
}
