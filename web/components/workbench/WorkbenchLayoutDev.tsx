"use client";
import { ReactNode } from "react";
import BasketHeader from "@/components/basket/BasketHeader";
import NarrativePane from "@/components/basket/NarrativePane";

interface Props {
  initialSnapshot: any;
  children?: ReactNode;
}

export default function WorkbenchLayoutDev({ initialSnapshot, children }: Props) {
  const scopes = Array.from(
    new Set((initialSnapshot.blocks || []).map((b: any) => b.scope).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-yellow-50 p-4 space-y-4">
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
  );
}
