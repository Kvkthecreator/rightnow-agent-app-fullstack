"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BasketNavigationHub } from "@/components/navigation/BasketNavigationHub";
import { useBasket } from "@/contexts/BasketContext";
import type { Document } from "@/types";

// Clean, simplified layout interface
interface BasketWorkLayoutProps {
  basketId: string;
  basketName: string;
  documents: Document[];
  children: ReactNode;
}

export default function BasketWorkLayout({
  basketId,
  basketName,
  documents,
  children
}: BasketWorkLayoutProps) {
  const pathname = usePathname();
  const { basket } = useBasket();

  // Clean view detection based on URL structure
  const getCurrentView = (): 'dashboard' | 'documents' | 'timeline' | 'detailed-view' => {
    if (pathname.includes('/detailed-view')) return 'detailed-view';
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/timeline')) return 'timeline';
    return 'dashboard';
  };

  // Clean document ID detection 
  const getActiveDocumentId = (): string | undefined => {
    const match = pathname.match(/\/documents\/([^\/]+)/);
    return match?.[1] === 'new' ? undefined : match?.[1];
  };

  return (
    <div className="basket-work-layout h-screen flex bg-gray-50">
      <BasketNavigationHub
        basketId={basketId}
        basketName={basket?.name || basketName}
        documents={documents}
        currentView={getCurrentView()}
        activeDocumentId={getActiveDocumentId()}
        onCreateDocument={() => {}} // Now handled directly in navigation
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {children}
      </main>
    </div>
  );
}
