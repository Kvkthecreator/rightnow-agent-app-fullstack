"use client";
import BasketDashboard from "@/components/views/BasketDashboard";
import LiveThinkingPartner from "@/components/intelligence/LiveThinkingPartner";
import StandardizedBasketLayout from "@/components/basket/StandardizedBasketLayout";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactNode } from "react";
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

  // Determine context type based on current tab
  const contextType = tab === "insights" ? "insights" : 
                     tab === "history" ? "settings" : "dashboard";
  
  // Create main content based on tab
  let mainContent: ReactNode;
  switch (tab) {
    case "dashboard":
      mainContent = (
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
      mainContent = (
        <LiveThinkingPartner
          basketId={basketId}
          basketName={basketName}
        />
      );
      break;
    case "history":
      mainContent = (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Basket History</h1>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Track changes, document versions, and collaboration history for this basket.
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-sm">History functionality coming soon...</p>
              </div>
            </div>
          </div>
        </div>
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
      documents={documents}
      mainContent={mainContent}
      contextType={contextType}
      intelligenceMode={tab === "insights" ? "detailed" : "ambient"}
      showIntelligenceHints={true}
      onIntelligenceDiscovered={() => console.log("User discovered intelligence features")}
    />
  );
}
