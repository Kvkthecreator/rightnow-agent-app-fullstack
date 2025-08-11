"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BasketNavigationHub } from "@/components/navigation/BasketNavigationHub";
import { useBasket } from "@/contexts/BasketContext";

interface BasketWorkLayoutProps {
  children: ReactNode;
}

export default function BasketWorkLayout({ children }: BasketWorkLayoutProps) {
  const pathname = usePathname();
  const { basket, documents } = useBasket();
  const basketId = basket?.id || "";
  const basketName = basket?.name || "";

  const getCurrentView = (): "dashboard" | "documents" | "timeline" | "detailed-view" => {
    if (pathname.includes("/detailed-view")) return "detailed-view";
    if (pathname.includes("/documents")) return "documents";
    if (pathname.includes("/timeline")) return "timeline";
    return "dashboard";
  };

  const getActiveDocumentId = (): string | undefined => {
    const match = pathname.match(/\/documents\/([^\/]+)/);
    return match?.[1] === "new" ? undefined : match?.[1];
  };

  return (
    <div className="basket-work-layout h-screen flex bg-gray-50">
      <BasketNavigationHub
        basketId={basketId}
        basketName={basketName}
        documents={documents}
        currentView={getCurrentView()}
        activeDocumentId={getActiveDocumentId()}
        onCreateDocument={() => {}}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">{children}</main>

      <aside className="w-80 border-l border-gray-200 bg-white p-4 hidden lg:block">
        <div className="text-sm text-gray-500">Right Sidebar</div>
      </aside>
    </div>
  );
}

