/* Pending Block-Change Queue
   Lists rows from block_change_queue where status='pending'
   User can Approve → status='approved'  |  Reject → 'rejected'
*/
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";

interface QueueRow {
  id: string;
  action: string;
  block_id: string;
  proposed_data: any;
  created_at: string;
  context_blocks?: { label: string };
}

export default function BlockQueuePage() {
  const supabase = createClient();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch queue rows + block labels in one call
  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("pending_block_queue_with_block_label");
    // Fallback if RPC not created → simple join
    if (data) setRows(data as any);
    else {
      const { data: raw } = await supabase
        .from("block_change_queue")
        .select(
          "id,action,block_id,proposed_data,created_at,context_blocks(label)"
        )
        .eq("status", "pending")
        .order("created_at");
      setRows(raw as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handle = async (id: string, newStatus: "approved" | "rejected") => {
    await supabase
      .from("block_change_queue")
      .update({ status: newStatus })
      .eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Pending Block Updates</h1>
        {loading && <p>Loading…</p>}
        {!loading && rows.length === 0 && <p>No pending changes 🎉</p>}
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="border rounded p-4 flex justify-between items-start gap-4"
            >
              <div className="grow">
                <h3 className="font-medium">
                  {row.context_blocks?.label || row.block_id.slice(0, 8)}
                </h3>
                <p className="text-xs text-gray-500">
                  {row.action.toUpperCase()} · {new Date(row.created_at).toLocaleString()}
                </p>
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(row.proposed_data, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <Button onClick={() => handle(row.id, "approved")}>Approve</Button>
                <Button variant="outline" onClick={() => handle(row.id, "rejected")}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
  );
}
