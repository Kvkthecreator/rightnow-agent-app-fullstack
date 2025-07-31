"use client";
import BasketDashboard from "@/components/views/BasketDashboard";
import LiveThinkingPartner from "@/components/intelligence/LiveThinkingPartner";
import { AdaptiveLayout } from "@/components/layouts/AdaptiveLayout";
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

  // Map tabs to view types
  const getViewType = (tab: string): 'dashboard' | 'documents' | 'insights' | 'understanding' => {
    switch (tab) {
      case "insights": return "insights";
      case "history": return "understanding";
      case "documents": return "documents";
      default: return "dashboard";
    }
  };
  
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
            <h1 className="text-2xl font-bold mb-6">Project Evolution</h1>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                See how your project has evolved through our collaboration.
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-sm">Project evolution tracking coming soon...</p>
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
    <AdaptiveLayout
      view={getViewType(tab)}
      basketId={basketId}
    >
      {mainContent}
    </AdaptiveLayout>
  );
}
