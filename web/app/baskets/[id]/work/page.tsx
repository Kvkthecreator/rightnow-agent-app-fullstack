"use client";

import { useEffect, useState } from "react";
import DumpArea from "@/components/ui/DumpArea";
import BasketInputLog from "@/components/BasketInputLog"; // to be implemented
import ParsedBlockList from "@/components/ParsedBlockList"; // to be implemented
import { ScopedDropZone } from "@/components/drop/ScopedDropZone";

export default function BasketWorkPage({ params }: any) {
  const [basket, setBasket] = useState<any>(null);

  const handleFileDrop = (files: File[]) => {
    console.log("\ud83d\udcbe Basket Work dropped files:", files);
    // TODO: Route files to thread or chat upload system
  };

  useEffect(() => {
    const fetchBasket = async () => {
      const res = await fetch(`/api/baskets/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setBasket(json);
      }
    };
    fetchBasket();
  }, [params.id]);

  if (!basket) return <p className="p-4">Loading…</p>;

  return (
    <ScopedDropZone onFilesDropped={handleFileDrop}>
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">🧶 {basket.intent_summary || "Untitled Basket"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste, upload, and Yarnnn will remember it all.
        </p>
      </div>

      <section>
        <DumpArea
          basketId={params.id}
          initialText={basket.raw_dump || ""}
          mode="append"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">🕓 Recent Inputs</h2>
        <BasketInputLog basketId={params.id} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">🧩 Context Blocks</h2>
        <ParsedBlockList basketId={params.id} />
      </section>
    </div>
    </ScopedDropZone>
  );
}
