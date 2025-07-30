"use client";
import DocumentList from "@/components/basket/DocumentList";
import BasketDashboard from "@/components/views/BasketDashboard";
import LiveThinkingPartner from "@/components/intelligence/LiveThinkingPartner";
import StandardizedBasketLayout from "@/components/basket/StandardizedBasketLayout";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { createDocumentWithPrompt } from "@/lib/documents/createDocument";
import type { Document } from "@/types";

interface Props {
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
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "dashboard";
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const handleCreateDocument = async () => {
    if (isCreatingDocument) return;
    
    setIsCreatingDocument(true);
    try {
      const newDocument = await createDocumentWithPrompt(basketId);
      router.refresh();
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  // Determine context type based on current tab
  const contextType = tab === "insights" ? "insights" : "dashboard";
  
  // Create main content based on tab
  let mainContent: ReactNode;
  switch (tab) {
    case "dashboard":
      mainContent = (
        <div className="flex w-full min-h-screen">
          {/* Document list sidebar */}
          <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
            <div className="flex flex-col h-full">
              <div data-discovery="document-list">
                <DocumentList basketId={basketId} documents={documents} />
              </div>
              <div className="p-4 border-t">
                <button 
                  data-discovery="create-document"
                  className="w-full text-sm bg-primary text-primary-foreground hover:opacity-90 py-2 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleCreateDocument}
                  disabled={isCreatingDocument}
                >
                  {isCreatingDocument ? 'Creating...' : '+ Create Document'}
                </button>
              </div>
            </div>
          </aside>
          
          {/* Main dashboard content */}
          <div className="flex-1 overflow-y-auto">
            <BasketDashboard
              basketId={basketId}
              basketName={basketName}
              dumpBody={dumpBody}
              empty={empty}
              documents={documents}
            />
          </div>
        </div>
      );
      break;
    case "insights":
      mainContent = (
        <LiveThinkingPartner
          basketId={basketId}
          basketName={basketName}
        />
      );
      break;
    default:
      mainContent = <div className="p-4">Coming soon: {tab}</div>;
  }

  return (
    <StandardizedBasketLayout
      basketId={basketId}
      basketName={basketName}
      status={status}
      scope={scope}
      mainContent={mainContent}
      contextType={contextType}
      intelligenceMode={tab === "insights" ? "detailed" : "ambient"}
      showIntelligenceHints={true}
      onIntelligenceDiscovered={() => console.log("User discovered intelligence features")}
    />
  );
}
