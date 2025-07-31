"use client";
import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BasketNavigationHub } from "@/components/navigation/BasketNavigationHub";
import { useBasketDocuments } from "@/lib/hooks/useBasketDocuments";
import { DashboardView } from "@/components/views/DashboardView";
import BasketDashboard from "@/components/views/BasketDashboard";
import LiveThinkingPartner from "@/components/intelligence/LiveThinkingPartner";
import type { Document } from "@/types";

interface BasketWorkLayoutProps {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
  dumpBody?: string;
  empty?: boolean;
  documents?: Document[];
}

export default function BasketWorkLayout({
  basketId,
  basketName,
  status,
  scope,
  dumpBody,
  empty = false,
  documents,
}: BasketWorkLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  
  // Use hook for document management  
  const { documents: managedDocuments, createDocument } = useBasketDocuments(basketId);
  
  // Use managed documents if available, otherwise fall back to props
  const displayDocuments = managedDocuments.length > 0 ? managedDocuments : (documents || []);

  // Determine current view from URL
  const getCurrentView = (): 'dashboard' | 'documents' | 'timeline' => {
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/timeline')) return 'timeline';
    if (tab === 'insights') return 'documents'; // Map insights to documents view for now
    if (tab === 'history') return 'timeline';
    return 'dashboard';
  };

  // Get active document ID from URL
  const getActiveDocumentId = (): string | undefined => {
    const matches = pathname.match(/\/documents\/([^\/]+)/);
    return matches?.[1];
  };

  const handleCreateDocument = async () => {
    try {
      const newDoc = await createDocument('Untitled Document');
      // Navigate to the new document
      router.push(`/baskets/${basketId}/work/documents/${newDoc.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      // For now, just navigate to documents view
      router.push(`/baskets/${basketId}/work?tab=documents`);
    }
  };
  
  // Create main content based on current view
  const getMainContent = (): ReactNode => {
    const view = getCurrentView();
    
    switch (view) {
      case 'dashboard':
        return (
          <DashboardView 
            basketId={basketId}
            basketName={basketName}
          />
        );
      case 'documents':
        if (tab === 'insights') {
          return (
            <LiveThinkingPartner
              basketId={basketId}
              basketName={basketName}
            />
          );
        }
        return <div className="p-6">Documents View - Coming next</div>;
      case 'timeline':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Project Timeline</h1>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  See how your project has evolved through our collaboration.
                </div>
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm">Project timeline tracking coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <DashboardView 
            basketId={basketId}
            basketName={basketName}
          />
        );
    }
  };

  return (
    <div className="basket-work-layout h-screen flex bg-gray-50">
      <BasketNavigationHub
        basketId={basketId}
        basketName={basketName}
        documents={displayDocuments}
        currentView={getCurrentView()}
        activeDocumentId={getActiveDocumentId()}
        onCreateDocument={handleCreateDocument}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {getMainContent()}
      </main>
    </div>
  );
}
