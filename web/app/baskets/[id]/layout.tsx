import TopBar from "@/components/basket/TopBar";
import BasketNav from "@/components/basket/BasketNav";
import Guide from "@/components/basket/Guide";
import React from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface LayoutProps {
  children: React.ReactNode;
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

function BasketLayoutClient({
  basketId,
  basketName,
  children,
}: {
  basketId: string;
  basketName: string;
  children: React.ReactNode;
}) {
  "use client";
  const [showNav, setShowNav] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("basket-nav") !== "hidden";
  });

  React.useEffect(() => {
    localStorage.setItem("basket-nav", showNav ? "show" : "hidden");
  }, [showNav]);

  return (
    <div className="flex h-screen flex-col">
      <TopBar title={basketName} onToggleNav={() => setShowNav((s) => !s)} />
      <div className="flex flex-1 overflow-hidden">
        {showNav && <BasketNav basketId={basketId} />}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <Guide />
      </div>
    </div>
  );
}
