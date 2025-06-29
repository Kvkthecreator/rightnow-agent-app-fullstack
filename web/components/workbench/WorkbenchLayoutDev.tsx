"use client";
import { ReactNode } from "react";
import BasketHeader from "@/components/basket/BasketHeader";
import NarrativePane from "@/components/basket/NarrativePane";
import RightPanelLayout from "@/components/layout/RightPanel";

interface Props {
  initialSnapshot: any;
  rightPanel?: ReactNode;
  children?: ReactNode;
}

export default function WorkbenchLayoutDev({ initialSnapshot, rightPanel, children }: Props) {
  const scopes = Array.from(
    new Set((initialSnapshot.blocks || []).map((b: any) => b.scope).filter(Boolean))
  ) as string[];

  return (
    <RightPanelLayout rightPanel={rightPanel}>
      <div className="min-h-screen p-4 space-y-4">
        <BasketHeader
          basketName={initialSnapshot.basket?.name || "Untitled Basket"}
          status="DRAFT"
          scope={scopes}
        />
        <NarrativePane
          rawText={initialSnapshot.raw_dump_body}
          blocks={initialSnapshot.blocks || []}
          onSelectBlock={(id) => console.log("select", id)}
        />
        {children}
      </div>
    </RightPanelLayout>
  );
}
