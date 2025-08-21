import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { checkBasketAccess } from "@/lib/baskets/access";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BasketLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });
  
  // Consolidated authorization and basket access check
  const { basket, workspace } = await checkBasketAccess(supabase, id);
  const basketName = basket.name || "Untitled Basket";
  
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
        
      </div>

      {/* Page Content */}
      <div className="py-6">{children}</div>
    </>
  );
}
