import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerWorkspace } from "@/lib/workspaces/getServerWorkspace";
import { listBasketsByWorkspace } from "@/lib/baskets/listBasketsByWorkspace";

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

  return children;
}
