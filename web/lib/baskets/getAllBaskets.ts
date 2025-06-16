import { createClient } from "@/lib/supabaseClient";

export interface BasketOverview {
  id: string;
  name: string | null;
  raw_dump: string | null;
  status: string | null;
  tags: string[] | null;
  commentary: string | null;
  blocks_count?: number | null;
}

export async function getAllBaskets(): Promise<BasketOverview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("baskets")
    .select(
      "id,name,raw_dump,status,tags,commentary,context_blocks(count)"
    )
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    raw_dump: b.raw_dump,
    status: b.status,
    tags: b.tags,
    commentary: b.commentary,
    blocks_count: b.context_blocks?.[0]?.count ?? 0,
  }));
}
