"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function QueueLink() {
  const supabase = createClient();
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from("block_change_queue")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .then(({ count }) => setCount(count || 0));
  }, []);

  return (
    <Link href="/queue" className="relative">
      Queue
      {count > 0 && (
        <span className="absolute -right-3 -top-2 rounded-full bg-red-600 text-white text-xs px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
