import { createClient } from "@/lib/supabaseClient";

export interface BasketOverview {
  id: string;
  name: string | null;
  state: string | null;
  created_at?: string | null;
  raw_dumps: { basket_id: string; created_at: string }[];
}

export async function getAllBaskets(user: { id: string }): Promise<BasketOverview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("baskets")
    .select(
      "id,name,state,created_at,raw_dumps:id(basket_id,created_at)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    state: b.state,
    created_at: b.created_at,
    raw_dumps: b.raw_dumps ?? [],
  }));
}
