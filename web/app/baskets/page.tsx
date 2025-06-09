"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function BasketsPage() {
  const supabase = createClient();
  const [baskets, setBaskets] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('baskets')
      .select('id,intent_summary')
      .then(({ data }) => setBaskets(data || []));
  }, [supabase]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Your Baskets</h1>
      {baskets.length === 0 ? (
        <EmptyState
          title="\uD83D\uDC4B Welcome! Let\u2019s start your first basket \u2014 it only takes a minute."
          action={(
            <Button asChild>
              <Link href="/baskets/create">Create Basket</Link>
            </Button>
          )}
        />
      ) : (
        <ul className="space-y-2">
          {baskets.map((b) => (
            <li key={b.id}>
              <Link href={`/baskets/${b.id}/work`} className="text-blue-600 underline">
                {b.intent_summary || b.id}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
