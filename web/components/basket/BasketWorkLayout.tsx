"use client";

import { ReactNode } from "react";
import BasketSidebar from "@/components/basket/BasketSidebar";
import { useBasket } from "@/contexts/BasketContext";

interface BasketWorkLayoutProps {
  children: ReactNode;
}

export default function BasketWorkLayout({ children }: BasketWorkLayoutProps) {
  const { basket, documents } = useBasket();
  const basketId = basket?.id || "";
  const basketName = basket?.name || "";
  const basketStatus = basket?.status || "";
  const scope: string[] = [];

  return (
    <div className="grid grid-cols-[280px_1fr_320px] h-full">
      <BasketSidebar
        basketId={basketId}
        basketName={basketName}
        status={basketStatus}
        scope={scope}
        documents={documents}
      />
      <main>{children}</main>
      <aside>{/* right sidebar placeholder */}</aside>
    </div>
  );
}

