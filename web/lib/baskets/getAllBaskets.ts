import { createClient } from "@/lib/supabaseClient";

export interface BasketOverview {
  id: string;
  intent_summary: string | null;
  raw_dump: string | null;
  updated_at: string | null;
  created_at: string | null;
  blocks_count?: number | null;
}

export async function getAllBaskets(): Promise<BasketOverview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("baskets")
    .select(
      "id,intent_summary,raw_dump,updated_at,created_at,block_brief_link(count)"
    )
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((b: any) => ({
    id: b.id,
    intent_summary: b.intent_summary,
    raw_dump: b.raw_dump,
    updated_at: b.updated_at,
    created_at: b.created_at,
    blocks_count: b.block_brief_link?.[0]?.count ?? 0,
  }));
}
