"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

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
      <ul className="space-y-2">
        {baskets.map((b) => (
          <li key={b.id}>
            <Link href={`/baskets/${b.id}`} className="text-blue-600 underline">
              {b.intent_summary || b.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
