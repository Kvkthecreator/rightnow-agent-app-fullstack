"use client";
import DocumentList from "@/components/basket/DocumentList";
import BasketSidebar from "@/components/basket/BasketSidebar";
import BasketDashboard from "@/components/views/BasketDashboard";
import LiveThinkingPartner from "@/components/intelligence/LiveThinkingPartner";
import BrainSidebar from "@/components/intelligence/BrainSidebar";
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
  const [showBrainSidebar, setShowBrainSidebar] = useState(true);

  const handleCreateDocument = async () => {
    if (isCreatingDocument) return;
    
    setIsCreatingDocument(true);
    try {
      const newDocument = await createDocumentWithPrompt(basketId);
      // Refresh the page to show the new document
      router.refresh();
    } catch (error) {
      console.error('Failed to create document:', error);
      // Show error to user (in a real app, you'd use a toast/notification system)
      alert('Failed to create document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  let content: ReactNode;
  switch (tab) {
    case "dashboard":
      content = (
        <BasketDashboard
          basketId={basketId}
          basketName={basketName}
          dumpBody={dumpBody}
          empty={empty}
          documents={documents}
        />
      );
      break;
    case "insights":
      content = (
        <LiveThinkingPartner
          basketId={basketId}
          basketName={basketName}
        />
      );
      break;
    default:
      content = <div className="p-4">Coming soon: {tab}</div>;
  }

  return (
    <div className="flex h-full w-full">
      <BasketSidebar
        basketId={basketId}
        basketName={basketName}
        status={status}
        scope={scope}
      />
      
      {tab === "insights" ? (
        // Full intelligence interface for insights tab
        <div className="flex-1 overflow-hidden">{content}</div>
      ) : (
        // Main dashboard with ambient intelligence
        <div className="flex w-full min-h-screen flex-1">
          {/* Document list sidebar */}
          <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
            <div className="flex flex-col h-full">
              <DocumentList basketId={basketId} documents={documents} />
              <div className="p-4 border-t">
                <button 
                  className="w-full text-sm bg-primary text-primary-foreground hover:opacity-90 py-2 px-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleCreateDocument}
                  disabled={isCreatingDocument}
                >
                  {isCreatingDocument ? 'Creating...' : '+ Create Document'}
                </button>
              </div>
            </div>
          </aside>
          
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Brain sidebar toggle button */}
            <button
              onClick={() => setShowBrainSidebar(!showBrainSidebar)}
              className="fixed bottom-4 right-4 z-10 bg-primary text-primary-foreground hover:opacity-90 p-3 rounded-full shadow-lg transition-all lg:hidden"
              title={showBrainSidebar ? "Hide AI Brain" : "Show AI Brain"}
            >
              🧠
            </button>
            
            {content}
          </div>
          
          {/* Brain sidebar - ambient intelligence for non-insights tabs */}
          {showBrainSidebar && (
            <BrainSidebar
              basketId={basketId}
              currentDocumentId={undefined}
              focusMode="basket"
              className="hidden lg:flex"
            />
          )}
          
          {/* Toggle button for desktop */}
          <div className="hidden lg:flex items-center justify-center w-6 border-l">
            <button
              onClick={() => setShowBrainSidebar(!showBrainSidebar)}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title={showBrainSidebar ? "Hide AI Brain" : "Show AI Brain"}
            >
              {showBrainSidebar ? '→' : '🧠'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
