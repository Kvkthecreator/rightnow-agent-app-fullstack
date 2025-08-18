import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import BasketLayoutClient from "@/components/basket/BasketLayoutClient";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BasketLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });
  
  // Ensure user is authenticated and has workspace
  const workspace = await ensureWorkspaceServer(supabase);
  
  // Fetch basket name
  let basketName = "Basket";
  if (workspace) {
    const { data: basket } = await supabase
      .from("baskets")
      .select("name")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .single();
    
    if (basket?.name) {
      basketName = basket.name;
    }
  }
  
  return (
    <BasketLayoutClient basketId={id} basketName={basketName}>
      {children}
    </BasketLayoutClient>
  );
}
