import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import BasketTabs from "@/components/baskets/BasketTabs";

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
    <>
      {/* Page Header with Basket Title */}
      <div className="border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧺</span>
            <div>
              <h1 className="text-xl font-semibold">{basketName}</h1>
              <p className="text-sm text-muted-foreground">
                Last updated today
              </p>
            </div>
          </div>
        </div>
        
        {/* Inline Tabs */}
        <BasketTabs basketId={id} />
      </div>

      {/* Page Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </>
  );
}
