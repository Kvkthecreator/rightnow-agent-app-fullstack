// web/lib/baskets/getAllBaskets.ts
import { createClient } from "@/lib/supabaseClient";
import { Database } from "@/lib/dbTypes";

export type BasketOverview = Pick<
  Database["public"]["Tables"]["baskets"]["Row"],
  "id" | "name" | "created_at"
>;

export async function getAllBaskets(): Promise<BasketOverview[]> {
  const supabase = createClient();

  const {
    data,
    error,
  } = await supabase
    .from("baskets")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase error while fetching baskets:", error.message);
    return [];
  }

  return data ?? [];
}
