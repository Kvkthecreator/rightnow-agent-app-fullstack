"use client";
import { useEffect, useState } from "react";
import BasketInputPanel from "@/components/BasketInputPanel";

export default function BasketWorkPage({ params }: any) {
  const [basket, setBasket] = useState<any>(null);

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
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Work on Basket</h1>
      <BasketInputPanel
        mode="edit"
        basketId={params.id}
        initial={{ intent_summary: basket.intent_summary }}
      />
    </div>
  );
}
