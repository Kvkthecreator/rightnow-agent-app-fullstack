"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { apiGet } from "@/lib/api";

export default function BasketDetailPage({ params }: any) {
  const [basket, setBasket] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBasket = async () => {
      try {
        const json = await apiGet<any>(`/api/baskets/${params.id}`);
        setBasket(json);
        setBlocks(json.blocks || []);
        setConfigs(json.configs || []);
      } catch (err) {
        console.warn("Failed to load basket", err);
      }
    };
    fetchBasket();
  }, [params.id]);

  if (!basket) return <p className="p-4">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Basket Detail</h1>
      <p><b>Name:</b> {basket.name}</p>
      <section>
        <h2 className="font-semibold">Blocks</h2>
        <ul className="list-disc pl-5 text-sm">
          {blocks.map((b) => (
            <li key={b.id}>{b.label} ({b.type})</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">Configs</h2>
        <ul className="list-disc pl-5 text-sm">
          {configs.map((c) => (
            <li key={c.id}><a className="text-blue-600" href={c.external_url}>{c.title || c.platform}</a></li>
          ))}
        </ul>
      </section>
      <Button asChild>
        <Link href={`/baskets/${params.id}/work`}>Add to Basket</Link>
      </Button>
    </div>
  );
}
