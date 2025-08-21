import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";

export async function appendDumpToTimeline(basket_id: string, dump: { id: string; body_md: string | null; created_at: string; }) {
  const supabase = createServerComponentClient({ cookies });
  await supabase.from("basket_history").insert({
    basket_id,
    ts: dump.created_at,
    kind: "dump",
    ref_id: dump.id,
    preview: (dump.body_md ?? "").slice(0, 160),
    payload: { id: dump.id, text: dump.body_md, created_at: dump.created_at },
  });
}