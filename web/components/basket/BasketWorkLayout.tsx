"use client";
import DocumentList from "@/components/basket/DocumentList";
import BasketSidebar from "@/components/basket/BasketSidebar";
import BasketDashboard from "@/components/views/BasketDashboard";
import { useSearchParams } from "next/navigation";
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
  const tab = searchParams.get("tab") || "dashboard";

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
      <div className="md:flex w-full min-h-screen flex-1 overflow-y-auto">
        <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
          <div className="flex flex-col h-full">
            <DocumentList basketId={basketId} documents={documents} />
            <div className="p-4 border-t">
              <button className="w-full text-sm" disabled>
                + Create Document
              </button>
            </div>
          </div>
        </aside>
        <div className="flex-1 overflow-y-auto">{content}</div>
      </div>
    </div>
  );
}
