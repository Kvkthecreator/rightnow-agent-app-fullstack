import { createClient } from "@/lib/supabaseClient";

export interface BasketOverview {
  id: string;
  name: string | null;
  raw_dump_body: string | null;
  status: string | null;
  tags: string[] | null;
  commentary: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  blocks_count?: number | null;
}

export async function getAllBaskets(): Promise<BasketOverview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("baskets")
    .select(
      `
        id,
        name,
        status,
        tags,
        commentary,
        created_at,
        updated_at,
        blocks(count),
        raw_dump:raw_dump_id (
          id,
          body_md
        )
      `
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    raw_dump_body: b.raw_dump?.body_md ?? null,
    status: b.status,
    tags: b.tags,
    commentary: b.commentary,
    created_at: b.created_at,
    updated_at: b.updated_at,
    blocks_count: b.blocks?.[0]?.count ?? 0,
  }));
}
