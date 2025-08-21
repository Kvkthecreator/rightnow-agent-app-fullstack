import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { listBasketsByWorkspace } from "@/lib/baskets/listBasketsByWorkspace";
import { setLastBasketId } from "@/lib/cookies/workspaceCookies";

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

  const canonical = baskets[0];
  await setLastBasketId(ws.id, canonical.id);

  return <>{children}</>;
}
